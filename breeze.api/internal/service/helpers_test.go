package service

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
)

// ─── UUID ────────────────────────────────────────────────

func TestUUIDToPG(t *testing.T) {
	t.Run("nil returns invalid", func(t *testing.T) {
		result := uuidToPG(nil)
		if result.Valid {
			t.Fatal("expected invalid pgtype.UUID for nil input")
		}
	})

	t.Run("round-trip", func(t *testing.T) {
		id := uuid.New()
		pg := uuidToPG(&id)
		if !pg.Valid {
			t.Fatal("expected valid pgtype.UUID")
		}
		back := uuidFromPG(pg)
		if back == nil {
			t.Fatal("expected non-nil uuid from valid pgtype")
		}
		if *back != id {
			t.Fatalf("round-trip mismatch: got %s, want %s", *back, id)
		}
	})
}

func TestUUIDFromPG(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		result := uuidFromPG(pgtype.UUID{})
		if result != nil {
			t.Fatal("expected nil for invalid pgtype.UUID")
		}
	})

	t.Run("valid returns uuid", func(t *testing.T) {
		id := uuid.New()
		pg := pgtype.UUID{Bytes: id, Valid: true}
		result := uuidFromPG(pg)
		if result == nil {
			t.Fatal("expected non-nil")
		}
		if *result != id {
			t.Fatalf("mismatch: got %s, want %s", *result, id)
		}
	})
}

func TestPgtypeUUIDFromPtr(t *testing.T) {
	t.Run("nil returns invalid", func(t *testing.T) {
		result := pgtypeUUIDFromPtr(nil)
		if result.Valid {
			t.Fatal("expected invalid")
		}
	})

	t.Run("round-trip", func(t *testing.T) {
		id := uuid.New()
		pg := pgtypeUUIDFromPtr(&id)
		back := pgtypeUUIDToPtr(pg)
		if back == nil || *back != id {
			t.Fatalf("round-trip failed")
		}
	})
}

func TestPgtypeUUIDToPtr(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		if pgtypeUUIDToPtr(pgtype.UUID{}) != nil {
			t.Fatal("expected nil")
		}
	})
}

// ─── Decimal / Numeric ───────────────────────────────────

func TestDecimalToPGNumeric(t *testing.T) {
	t.Run("nil returns zero numeric", func(t *testing.T) {
		result, err := decimalToPGNumeric(nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.Valid {
			t.Fatal("expected invalid numeric for nil decimal")
		}
	})

	t.Run("preserves precision", func(t *testing.T) {
		d := decimal.MustParse("123456.789012")
		result, err := decimalToPGNumeric(&d)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !result.Valid {
			t.Fatal("expected valid numeric")
		}
	})

	t.Run("zero value", func(t *testing.T) {
		d := decimal.Zero
		result, err := decimalToPGNumeric(&d)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !result.Valid {
			t.Fatal("expected valid numeric for zero")
		}
	})

	t.Run("negative value", func(t *testing.T) {
		d := decimal.MustParse("-999.99")
		result, err := decimalToPGNumeric(&d)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		back, err := decimalFromPGNumeric(result)
		if err != nil {
			t.Fatalf("unexpected error on round-trip: %v", err)
		}
		if back == nil || !back.Equal(d) {
			t.Fatalf("round-trip mismatch: got %v, want %v", back, d)
		}
	})
}

func TestDecimalFromPGNumeric(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		result, err := decimalFromPGNumeric(pgtype.Numeric{})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != nil {
			t.Fatal("expected nil for invalid numeric")
		}
	})

	t.Run("round-trip preserves exact decimal", func(t *testing.T) {
		testValues := []string{
			"0.01",
			"1000000.00",
			"0.0001",
			"99999999.99",
			"-500.50",
		}
		for _, s := range testValues {
			d := decimal.MustParse(s)
			pg, err := decimalToPGNumeric(&d)
			if err != nil {
				t.Fatalf("convert to PG failed for %s: %v", s, err)
			}
			back, err := decimalFromPGNumeric(pg)
			if err != nil {
				t.Fatalf("convert from PG failed for %s: %v", s, err)
			}
			if back == nil {
				t.Fatalf("nil result for %s", s)
			}
			if !back.Equal(d) {
				t.Fatalf("round-trip mismatch for %s: got %s", s, back.String())
			}
		}
	})
}

func TestPgtypeNumericFromDecimal(t *testing.T) {
	t.Run("nil returns invalid", func(t *testing.T) {
		result := pgtypeNumericFromDecimal(nil)
		if result.Valid {
			t.Fatal("expected invalid")
		}
	})

	t.Run("round-trip", func(t *testing.T) {
		d := decimal.MustParse("42.50")
		pg := pgtypeNumericFromDecimal(&d)
		back := pgtypeNumericToDecimal(pg)
		if back == nil || !back.Equal(d) {
			t.Fatalf("round-trip failed")
		}
	})
}

func TestPgtypeNumericToDecimal(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		if pgtypeNumericToDecimal(pgtype.Numeric{}) != nil {
			t.Fatal("expected nil")
		}
	})
}

// ─── Date ────────────────────────────────────────────────

func TestDateToPGDate(t *testing.T) {
	t.Run("nil returns invalid", func(t *testing.T) {
		result := dateToPGDate(nil)
		if result.Valid {
			t.Fatal("expected invalid")
		}
	})

	t.Run("round-trip", func(t *testing.T) {
		ts := time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC)
		pg := dateToPGDate(&ts)
		if !pg.Valid {
			t.Fatal("expected valid")
		}
		back := dateFromPGDate(pg)
		if back == nil {
			t.Fatal("expected non-nil")
		}
		if !back.Equal(ts) {
			t.Fatalf("round-trip mismatch: got %v, want %v", *back, ts)
		}
	})
}

func TestDateFromPGDate(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		if dateFromPGDate(pgtype.Date{}) != nil {
			t.Fatal("expected nil")
		}
	})
}

func TestPgtypeDateFromString(t *testing.T) {
	t.Run("nil string returns invalid", func(t *testing.T) {
		result := pgtypeDateFromString(nil)
		if result.Valid {
			t.Fatal("expected invalid for nil string")
		}
	})

	t.Run("valid ISO date", func(t *testing.T) {
		s := "2024-01-15"
		result := pgtypeDateFromString(&s)
		if !result.Valid {
			t.Fatal("expected valid")
		}
		if result.Time.Year() != 2024 || result.Time.Month() != 1 || result.Time.Day() != 15 {
			t.Fatalf("wrong date: %v", result.Time)
		}
	})

	t.Run("invalid format returns invalid", func(t *testing.T) {
		s := "not-a-date"
		result := pgtypeDateFromString(&s)
		if result.Valid {
			t.Fatal("expected invalid for bad format")
		}
	})
}

func TestPgtypeDateToString(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		if pgtypeDateToString(pgtype.Date{}) != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("round-trip", func(t *testing.T) {
		s := "2024-12-25"
		pg := pgtypeDateFromString(&s)
		back := pgtypeDateToString(pg)
		if back == nil || *back != s {
			t.Fatalf("round-trip mismatch: got %v, want %s", back, s)
		}
	})
}

// ─── Timestamptz ─────────────────────────────────────────

func TestTimestamptzToTime(t *testing.T) {
	t.Run("invalid returns zero time", func(t *testing.T) {
		result := timestamptzToTime(pgtype.Timestamptz{})
		if !result.IsZero() {
			t.Fatal("expected zero time for invalid timestamptz")
		}
	})

	t.Run("converts to UTC", func(t *testing.T) {
		// Create a time in a non-UTC timezone
		loc, _ := time.LoadLocation("America/New_York")
		ts := time.Date(2024, 6, 15, 14, 30, 0, 0, loc)
		pg := pgtype.Timestamptz{Time: ts, Valid: true}
		result := timestamptzToTime(pg)
		if result.Location() != time.UTC {
			t.Fatal("expected UTC timezone")
		}
		if result.Hour() != 18 { // 14:30 EDT = 18:30 UTC
			t.Fatalf("wrong hour after UTC conversion: got %d, want 18", result.Hour())
		}
	})
}

func TestTimestamptzToTimePtr(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		if timestamptzToTimePtr(pgtype.Timestamptz{}) != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("valid returns ptr", func(t *testing.T) {
		ts := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
		pg := pgtype.Timestamptz{Time: ts, Valid: true}
		result := timestamptzToTimePtr(pg)
		if result == nil {
			t.Fatal("expected non-nil")
		}
		if !result.Equal(ts) {
			t.Fatalf("mismatch: got %v, want %v", *result, ts)
		}
	})
}
