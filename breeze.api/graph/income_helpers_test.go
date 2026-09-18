package graph

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

// ─── parseDate ───────────────────────────────────────────

func TestParseDate(t *testing.T) {
	t.Run("RFC3339 format", func(t *testing.T) {
		result, err := parseDate("2024-06-15T10:30:00Z")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.Year() != 2024 || result.Month() != 6 || result.Day() != 15 {
			t.Fatalf("wrong date: %v", result)
		}
	})

	t.Run("YYYY-MM-DD format", func(t *testing.T) {
		result, err := parseDate("2024-01-15")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.Year() != 2024 || result.Month() != 1 || result.Day() != 15 {
			t.Fatalf("wrong date: %v", result)
		}
	})

	t.Run("invalid format returns error", func(t *testing.T) {
		_, err := parseDate("not-a-date")
		if err == nil {
			t.Fatal("expected error for invalid date format")
		}
	})

	t.Run("empty string returns error", func(t *testing.T) {
		_, err := parseDate("")
		if err == nil {
			t.Fatal("expected error for empty string")
		}
	})
}

// ─── parseOptionalDate ──────────────────────────────────

func TestParseOptionalDate(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		result, err := parseOptionalDate(nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != nil {
			t.Fatal("expected nil for nil input")
		}
	})

	t.Run("empty string returns nil", func(t *testing.T) {
		empty := ""
		result, err := parseOptionalDate(&empty)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != nil {
			t.Fatal("expected nil for empty string")
		}
	})

	t.Run("valid date returns ptr", func(t *testing.T) {
		s := "2024-06-15"
		result, err := parseOptionalDate(&s)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result == nil {
			t.Fatal("expected non-nil for valid date")
		}
		if result.Day() != 15 {
			t.Fatalf("wrong day: %d", result.Day())
		}
	})

	t.Run("invalid date returns error", func(t *testing.T) {
		bad := "not-a-date"
		_, err := parseOptionalDate(&bad)
		if err == nil {
			t.Fatal("expected error for invalid date")
		}
	})
}

// ─── parseOptionalUUID ─────────────────────────────────

func TestParseOptionalUUID(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		result, err := parseOptionalUUID(nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("empty string returns nil", func(t *testing.T) {
		empty := ""
		result, err := parseOptionalUUID(&empty)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("valid UUID returns ptr", func(t *testing.T) {
		id := uuid.New().String()
		result, err := parseOptionalUUID(&id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result == nil {
			t.Fatal("expected non-nil")
		}
		if result.String() != id {
			t.Fatalf("mismatch: got %s, want %s", result, id)
		}
	})

	t.Run("invalid UUID returns error", func(t *testing.T) {
		bad := "not-a-uuid"
		_, err := parseOptionalUUID(&bad)
		if err == nil {
			t.Fatal("expected error for invalid UUID")
		}
	})
}

// ─── parseUUIDSlice ────────────────────────────────────

func TestParseUUIDSlice(t *testing.T) {
	t.Run("empty slice", func(t *testing.T) {
		result, err := parseUUIDSlice([]string{})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result) != 0 {
			t.Fatalf("expected empty slice, got %d", len(result))
		}
	})

	t.Run("valid UUIDs", func(t *testing.T) {
		id1 := uuid.New().String()
		id2 := uuid.New().String()
		result, err := parseUUIDSlice([]string{id1, id2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result) != 2 {
			t.Fatalf("expected 2, got %d", len(result))
		}
		if result[0].String() != id1 || result[1].String() != id2 {
			t.Fatal("UUID mismatch")
		}
	})

	t.Run("invalid UUID in slice returns error", func(t *testing.T) {
		id := uuid.New().String()
		_, err := parseUUIDSlice([]string{id, "bad"})
		if err == nil {
			t.Fatal("expected error for invalid UUID in slice")
		}
	})
}

// ─── Pointer helpers ───────────────────────────────────

func TestInt32Ptr(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if int32Ptr(nil) != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("converts value", func(t *testing.T) {
		v := 42
		result := int32Ptr(&v)
		if result == nil || *result != 42 {
			t.Fatalf("expected ptr to 42, got %v", result)
		}
	})

	t.Run("large value", func(t *testing.T) {
		v := 2147483647 // max int32
		result := int32Ptr(&v)
		if result == nil || *result != 2147483647 {
			t.Fatalf("expected max int32")
		}
	})
}

func TestInt32PtrToInt(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if int32PtrToInt(nil) != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("converts value", func(t *testing.T) {
		v := int32(42)
		result := int32PtrToInt(&v)
		if result == nil || *result != 42 {
			t.Fatalf("expected ptr to 42")
		}
	})
}

func TestUuidPtrToString(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if uuidPtrToString(nil) != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("converts uuid", func(t *testing.T) {
		id := uuid.New()
		result := uuidPtrToString(&id)
		if result == nil || *result != id.String() {
			t.Fatalf("expected string representation")
		}
	})
}

func TestFormatOptionalDate(t *testing.T) {
	t.Run("nil returns nil", func(t *testing.T) {
		if formatOptionalDate(nil) != nil {
			t.Fatal("expected nil")
		}
	})

	t.Run("formats to RFC3339", func(t *testing.T) {
		ts := time.Date(2024, 6, 15, 10, 30, 0, 0, time.UTC)
		result := formatOptionalDate(&ts)
		if result == nil {
			t.Fatal("expected non-nil")
		}
		parsed, err := time.Parse(time.RFC3339, *result)
		if err != nil {
			t.Fatalf("result is not valid RFC3339: %v", err)
		}
		if !parsed.Equal(ts) {
			t.Fatalf("round-trip mismatch")
		}
	})
}

// ─── mapIncomeToModel nil handling ─────────────────────

func TestMapIncomeToModelNil(t *testing.T) {
	if mapIncomeToModel(nil) != nil {
		t.Fatal("expected nil for nil input")
	}
}

func TestMapRecurringIncomeToModelNil(t *testing.T) {
	if mapRecurringIncomeToModel(nil) != nil {
		t.Fatal("expected nil for nil input")
	}
}

// ─── uuidSliceToStringSlice ────────────────────────────

func TestUuidSliceToStringSlice(t *testing.T) {
	t.Run("empty", func(t *testing.T) {
		result := uuidSliceToStringSlice([]uuid.UUID{})
		if len(result) != 0 {
			t.Fatal("expected empty")
		}
	})

	t.Run("converts all", func(t *testing.T) {
		id1 := uuid.New()
		id2 := uuid.New()
		result := uuidSliceToStringSlice([]uuid.UUID{id1, id2})
		if len(result) != 2 {
			t.Fatalf("expected 2, got %d", len(result))
		}
		if result[0] != id1.String() || result[1] != id2.String() {
			t.Fatal("mismatch")
		}
	})
}
