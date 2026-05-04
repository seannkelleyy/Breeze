package service

import "errors"

var (
	ErrNotFound               = errors.New("not found")
	ErrUnauthorized           = errors.New("unauthorized")
	ErrSplitMismatch          = errors.New("split amounts must equal total expense amount")
	ErrNoSplits               = errors.New("expense must have at least one split")
	ErrSplitAmountNonPositive = errors.New("split amount must be positive")
)
