package db

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// The authorization pattern (docs/api/03-architecture.md) requires every
// query that reads or writes a specific row of a user-owned table to filter
// by user_id. This test enforces it: any by-id statement on a user-owned
// table whose WHERE clause lacks user_id fails, so new queries cannot
// silently skip ownership scoping.

// Reference data shared across all users — no ownership to enforce.
var globalTables = map[string]bool{
	"tax_brackets":        true,
	"standard_deductions": true,
	"fica_parameters":     true,
	"contribution_limits": true,
	"users":               true, // the user's own row; mutations resolve the caller
}

// Child tables without a user_id column — ownership flows through the
// parent row (expense → budget, plaid account → connection, item → snapshot),
// which is gated by the parent's scoped queries and resolvers.
var childTables = map[string]bool{
	"expense_splits":           true,
	"plaid_accounts":           true,
	"net_worth_snapshot_items": true,
}

// Statements whose ownership is enforced elsewhere:
//   - GetPlaidConnectionByID: fetched by the river worker without user
//     context, and by resolvers that guard with ensureOwned before use.
//
// Getter queries left unscoped at the SQL layer: their resolvers enforce
// ownership with ensureOwned after the fetch, so foreign rows resolve to
// not-found before any data is returned.
var queryAllowlist = map[string]string{
	"GetAssetByID":            "resolver: ensureOwned",
	"GetLiabilityByID":        "resolver: ensureOwned",
	"GetGoalByID":             "resolver: ensureOwned",
	"GetBudgetByID":           "service-internal",
	"GetExpenseByID":          "resolver: ensureOwned",
	"GetIncomeByID":           "resolver: ensureOwned",
	"GetRecurringIncomeByID":  "resolver: ensureOwned",
	"GetRecurringExpenseByID": "resolver: ensureOwned",
	"GetPlaidConnectionByID":  "river worker + resolver: ensureOwned",
	"UpdatePlaidConnection":   "internal sync of an owned connection",
}

var (
	stmtNameRe = regexp.MustCompile(`-- name: (\w+) :(\w+)`)
	tableRe    = regexp.MustCompile(`(?i)(?:FROM|UPDATE|INSERT INTO)\s+(\w+)`)
	byIDRe     = regexp.MustCompile(`\bid = \$\d+\b|\bid = sqlc\.arg\b`)
)

func TestUserOwnedQueriesScopeByID(t *testing.T) {
	root := filepath.Join("..", "..", "db", "queries")
	entries, err := os.ReadDir(root)
	if err != nil {
		t.Fatalf("read queries dir: %v", err)
	}

	var violations []string

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(root, entry.Name()))
		if err != nil {
			t.Fatalf("read %s: %v", entry.Name(), err)
		}
		markerRe := regexp.MustCompile(`(?m)^-- name: `)
		markers := markerRe.FindAllStringIndex(string(data), -1)
		for i, loc := range markers {
			end := len(data)
			if i+1 < len(markers) {
				end = markers[i+1][0]
			}
			b := data[loc[0]:end]
			m := stmtNameRe.FindStringSubmatch(b)
			if m == nil {
				continue
			}
			name, kind := m[1], m[2]
			if kind != "one" && kind != "many" && kind != "exec" && kind != "execrows" {
				continue
			}

			tm := tableRe.FindStringSubmatch(b)
			if tm == nil {
				continue
			}
			table := strings.ToLower(tm[1])
			if globalTables[table] || childTables[table] {
				continue
			}
			if _, allowlisted := queryAllowlist[name]; allowlisted {
				continue
			}

			where := whereClause(b)
			if where == "" || !byIDRe.MatchString(where) {
				continue // list-all / insert / keyed by a globally-unique column
			}
			if strings.Contains(where, "user_id") {
				continue // properly scoped
			}
			violations = append(violations, entry.Name()+"."+name+" ("+table+")")
		}
	}

	if len(violations) > 0 {
		t.Errorf("by-id statements on user-owned tables without user_id scope:\n  %s",
			strings.Join(violations, "\n  "))
	}
}

// whereClause returns the WHERE clause proper — everything from WHERE to the
// end of the statement, minus any RETURNING column list (whose column names
// would otherwise trip the user_id check).
func whereClause(b string) string {
	i := strings.Index(b, "WHERE")
	if i < 0 {
		return ""
	}
	clause := b[i:]
	if j := strings.Index(clause, "RETURNING"); j >= 0 {
		clause = clause[:j]
	}
	return clause
}
