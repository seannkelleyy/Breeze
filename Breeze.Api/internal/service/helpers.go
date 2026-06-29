package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
)

// uuidToPG converts a *uuid.UUID to pgtype.UUID for DB queries.
func uuidToPG(value *uuid.UUID) pgtype.UUID {
	if value == nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: *value, Valid: true}
}

// uuidFromPG converts a pgtype.UUID to *uuid.UUID. Returns nil when
// the pgtype.UUID is not valid.
func uuidFromPG(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	id := uuid.UUID(value.Bytes)
	return &id
}

// decimalToPGNumeric converts a *decimal.Decimal to pgtype.Numeric.
func decimalToPGNumeric(value *decimal.Decimal) (pgtype.Numeric, error) {
	if value == nil {
		return pgtype.Numeric{}, nil
	}
	var numeric pgtype.Numeric
	if err := numeric.Scan(value.String()); err != nil {
		return pgtype.Numeric{}, fmt.Errorf("encode decimal: %w", err)
	}
	return numeric, nil
}

// decimalFromPGNumeric converts a pgtype.Numeric to *decimal.Decimal.
func decimalFromPGNumeric(value pgtype.Numeric) (*decimal.Decimal, error) {
	if !value.Valid {
		return nil, nil
	}
	raw, err := value.Value()
	if err != nil {
		return nil, fmt.Errorf("read numeric value: %w", err)
	}
	if raw == nil {
		return nil, nil
	}
	text, ok := raw.(string)
	if !ok {
		return nil, fmt.Errorf("unexpected numeric value type: %T", raw)
	}
	parsed, err := decimal.Parse(text)
	if err != nil {
		return nil, fmt.Errorf("parse decimal: %w", err)
	}
	return &parsed, nil
}

// dateToPGDate converts a *time.Time to pgtype.Date.
func dateToPGDate(value *time.Time) pgtype.Date {
	if value == nil {
		return pgtype.Date{}
	}
	return pgtype.Date{Time: *value, Valid: true}
}

// dateFromPGDate converts a pgtype.Date to *time.Time.
func dateFromPGDate(value pgtype.Date) *time.Time {
	if !value.Valid {
		return nil
	}
	t := value.Time
	return &t
}

// timestamptzToTime converts a pgtype.Timestamptz to time.Time (UTC).
func timestamptzToTime(value pgtype.Timestamptz) time.Time {
	if !value.Valid {
		return time.Time{}
	}
	return value.Time.UTC()
}
