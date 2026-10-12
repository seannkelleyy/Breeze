package service

import (
	"context"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
)

// HsaReceipt is a qualified medical expense paid out of pocket and saved for
// later tax-free reimbursement from the HSA — the receipt-ladder strategy.
type HsaReceipt struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	IncurredOn  time.Time
	Description string
	Amount      decimal.Decimal
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// HsaReimbursement is a tax-free withdrawal taken against saved receipts.
type HsaReimbursement struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	ReimbursedOn time.Time
	Amount       decimal.Decimal
	Note         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// RothConversion is a Traditional → Roth rollover. Converted principal becomes
// penalty-free five years after January 1 of the conversion tax year.
type RothConversion struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	ConvertedOn time.Time
	Amount      decimal.Decimal
	FromAssetID *uuid.UUID
	ToAssetID   *uuid.UUID
	Note        string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// RothConversionBucket aggregates one tax year's conversions against the
// five-year clock.
type RothConversionBucket struct {
	Year        int
	Amount      decimal.Decimal
	AvailableOn time.Time
	Accessible  bool
}

// HsaLadderSummary carries the receipt-ladder figures in one place so the UI
// never re-derives them.
type HsaLadderSummary struct {
	TotalReceipts        decimal.Decimal
	TotalReimbursed      decimal.Decimal
	AvailableToReimburse decimal.Decimal
}

// RetirementAccess aggregates everything on the retirement-access page.
type RetirementAccess struct {
	HsaReceipts       []HsaReceipt
	HsaReimbursements []HsaReimbursement
	HsaSummary        HsaLadderSummary
	RothConversions   []RothConversion
	RothBuckets       []RothConversionBucket
}

type CreateHsaReceiptInput struct {
	UserID      uuid.UUID
	IncurredOn  time.Time
	Description string
	Amount      decimal.Decimal
}

type CreateHsaReimbursementInput struct {
	UserID       uuid.UUID
	ReimbursedOn time.Time
	Amount       decimal.Decimal
	Note         string
}

type CreateRothConversionInput struct {
	UserID      uuid.UUID
	ConvertedOn time.Time
	Amount      decimal.Decimal
	FromAssetID *uuid.UUID
	ToAssetID   *uuid.UUID
	Note        string
}

type RetirementAccessService struct {
	queries retirementAccessQuerier
}

func NewRetirementAccessService(queries retirementAccessQuerier) *RetirementAccessService {
	return &RetirementAccessService{queries: queries}
}

type retirementAccessQuerier interface {
	CreateHsaReceipt(ctx context.Context, arg sqlc.CreateHsaReceiptParams) (sqlc.HsaReceipt, error)
	ListHsaReceiptsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.HsaReceipt, error)
	SoftDeleteHsaReceipt(ctx context.Context, arg sqlc.SoftDeleteHsaReceiptParams) (int64, error)
	CreateHsaReimbursement(ctx context.Context, arg sqlc.CreateHsaReimbursementParams) (sqlc.HsaReimbursement, error)
	ListHsaReimbursementsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.HsaReimbursement, error)
	SoftDeleteHsaReimbursement(ctx context.Context, arg sqlc.SoftDeleteHsaReimbursementParams) (int64, error)
	CreateRothConversion(ctx context.Context, arg sqlc.CreateRothConversionParams) (sqlc.RothConversion, error)
	ListRothConversionsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.RothConversion, error)
	SoftDeleteRothConversion(ctx context.Context, arg sqlc.SoftDeleteRothConversionParams) (int64, error)
}

func (s *RetirementAccessService) CreateReceipt(ctx context.Context, input *CreateHsaReceiptInput) (*HsaReceipt, error) {
	if err := requirePositive(input.Amount, "receipt amount"); err != nil {
		return nil, err
	}

	row, err := s.queries.CreateHsaReceipt(ctx, sqlc.CreateHsaReceiptParams{
		UserID:      input.UserID,
		IncurredOn:  pgtype.Date{Time: input.IncurredOn, Valid: true},
		Description: input.Description,
		Amount:      input.Amount,
	})
	if err != nil {
		return nil, fmt.Errorf("create hsa receipt: %w", err)
	}

	return mapHsaReceiptRecord(&row), nil
}

func (s *RetirementAccessService) DeleteReceipt(ctx context.Context, userID, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteHsaReceipt(ctx, sqlc.SoftDeleteHsaReceiptParams{ID: id, UserID: userID})
	if err != nil {
		return fmt.Errorf("delete hsa receipt: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// CreateReimbursement records a tax-free withdrawal, rejecting amounts above
// the receipts saved so far — the ladder can never go negative.
func (s *RetirementAccessService) CreateReimbursement(ctx context.Context, input *CreateHsaReimbursementInput) (*HsaReimbursement, error) {
	if err := requirePositive(input.Amount, "reimbursement amount"); err != nil {
		return nil, err
	}

	summary, err := s.hsaSummary(ctx, input.UserID)
	if err != nil {
		return nil, err
	}
	if input.Amount.Cmp(summary.AvailableToReimburse) > 0 {
		return nil, ErrInsufficientHsaBalance
	}

	row, err := s.queries.CreateHsaReimbursement(ctx, sqlc.CreateHsaReimbursementParams{
		UserID:       input.UserID,
		ReimbursedOn: pgtype.Date{Time: input.ReimbursedOn, Valid: true},
		Amount:       input.Amount,
		Note:         input.Note,
	})
	if err != nil {
		return nil, fmt.Errorf("create hsa reimbursement: %w", err)
	}

	return mapHsaReimbursementRecord(&row), nil
}

func (s *RetirementAccessService) DeleteReimbursement(ctx context.Context, userID, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteHsaReimbursement(ctx, sqlc.SoftDeleteHsaReimbursementParams{ID: id, UserID: userID})
	if err != nil {
		return fmt.Errorf("delete hsa reimbursement: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *RetirementAccessService) CreateConversion(ctx context.Context, input *CreateRothConversionInput) (*RothConversion, error) {
	if err := requirePositive(input.Amount, "conversion amount"); err != nil {
		return nil, err
	}

	row, err := s.queries.CreateRothConversion(ctx, sqlc.CreateRothConversionParams{
		UserID:      input.UserID,
		ConvertedOn: pgtype.Date{Time: input.ConvertedOn, Valid: true},
		Amount:      input.Amount,
		FromAssetID: uuidToPGUUID(input.FromAssetID),
		ToAssetID:   uuidToPGUUID(input.ToAssetID),
		Note:        input.Note,
	})
	if err != nil {
		return nil, fmt.Errorf("create roth conversion: %w", err)
	}

	return mapRothConversionRecord(&row), nil
}

func (s *RetirementAccessService) DeleteConversion(ctx context.Context, userID, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteRothConversion(ctx, sqlc.SoftDeleteRothConversionParams{ID: id, UserID: userID})
	if err != nil {
		return fmt.Errorf("delete roth conversion: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// Access assembles the whole retirement-access page payload: the HSA receipt
// ladder with its computed summary, and Roth conversions with their
// five-year-clock buckets.
func (s *RetirementAccessService) Access(ctx context.Context, userID uuid.UUID) (*RetirementAccess, error) {
	receipts, err := s.queries.ListHsaReceiptsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list hsa receipts: %w", err)
	}

	reimbursements, err := s.queries.ListHsaReimbursementsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list hsa reimbursements: %w", err)
	}

	conversions, err := s.queries.ListRothConversionsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list roth conversions: %w", err)
	}

	summary, err := hsaSummaryFromRecords(receipts, reimbursements)
	if err != nil {
		return nil, err
	}

	out := &RetirementAccess{
		HsaReceipts:       make([]HsaReceipt, 0, len(receipts)),
		HsaReimbursements: make([]HsaReimbursement, 0, len(reimbursements)),
		HsaSummary:        *summary,
		RothConversions:   make([]RothConversion, 0, len(conversions)),
	}
	for i := range receipts {
		out.HsaReceipts = append(out.HsaReceipts, *mapHsaReceiptRecord(&receipts[i]))
	}
	for i := range reimbursements {
		out.HsaReimbursements = append(out.HsaReimbursements, *mapHsaReimbursementRecord(&reimbursements[i]))
	}
	for i := range conversions {
		out.RothConversions = append(out.RothConversions, *mapRothConversionRecord(&conversions[i]))
	}
	out.RothBuckets = rothConversionBuckets(out.RothConversions, time.Now().UTC())

	return out, nil
}

// hsaSummary loads receipts and reimbursements and derives the ladder totals.
func (s *RetirementAccessService) hsaSummary(ctx context.Context, userID uuid.UUID) (*HsaLadderSummary, error) {
	receipts, err := s.queries.ListHsaReceiptsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list hsa receipts: %w", err)
	}

	reimbursements, err := s.queries.ListHsaReimbursementsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list hsa reimbursements: %w", err)
	}

	return hsaSummaryFromRecords(receipts, reimbursements)
}

// hsaSummaryFromRecords derives the ladder totals from the two record lists.
func hsaSummaryFromRecords(receipts []sqlc.HsaReceipt, reimbursements []sqlc.HsaReimbursement) (*HsaLadderSummary, error) {
	totalReceipts := decimal.Zero
	for i := range receipts {
		next, err := totalReceipts.Add(receipts[i].Amount)
		if err != nil {
			return nil, fmt.Errorf("sum hsa receipts: %w", err)
		}
		totalReceipts = next
	}

	totalReimbursed := decimal.Zero
	for i := range reimbursements {
		next, err := totalReimbursed.Add(reimbursements[i].Amount)
		if err != nil {
			return nil, fmt.Errorf("sum hsa reimbursements: %w", err)
		}
		totalReimbursed = next
	}

	available, err := totalReceipts.Sub(totalReimbursed)
	if err != nil {
		return nil, fmt.Errorf("subtract reimbursed from receipts: %w", err)
	}

	return &HsaLadderSummary{
		TotalReceipts:        totalReceipts,
		TotalReimbursed:      totalReimbursed,
		AvailableToReimburse: available,
	}, nil
}

// rothConversionBuckets groups conversions by tax year; converted principal is
// penalty-free from January 1 five years after the conversion year.
func rothConversionBuckets(conversions []RothConversion, now time.Time) []RothConversionBucket {
	amounts := make(map[int]decimal.Decimal)
	var years []int
	for i := range conversions {
		year := conversions[i].ConvertedOn.Year()
		if _, seen := amounts[year]; !seen {
			years = append(years, year)
		}
		total, err := amounts[year].Add(conversions[i].Amount)
		if err != nil {
			continue
		}
		amounts[year] = total
	}

	buckets := make([]RothConversionBucket, 0, len(years))
	for _, year := range years {
		availableOn := time.Date(year+5, time.January, 1, 0, 0, 0, 0, time.UTC)
		buckets = append(buckets, RothConversionBucket{
			Year:        year,
			Amount:      amounts[year],
			AvailableOn: availableOn,
			Accessible:  !now.Before(availableOn),
		})
	}
	return buckets
}

func requirePositive(amount decimal.Decimal, label string) error {
	if amount.IsZero() || amount.IsNeg() {
		return fmt.Errorf("%s must be positive", label)
	}
	return nil
}

func mapHsaReceiptRecord(row *sqlc.HsaReceipt) *HsaReceipt {
	return &HsaReceipt{
		ID:          row.ID,
		UserID:      row.UserID,
		IncurredOn:  row.IncurredOn.Time,
		Description: row.Description,
		Amount:      row.Amount,
		CreatedAt:   timestamptzToTime(row.CreatedAt),
		UpdatedAt:   timestamptzToTime(row.UpdatedAt),
	}
}

func mapHsaReimbursementRecord(row *sqlc.HsaReimbursement) *HsaReimbursement {
	return &HsaReimbursement{
		ID:           row.ID,
		UserID:       row.UserID,
		ReimbursedOn: row.ReimbursedOn.Time,
		Amount:       row.Amount,
		Note:         row.Note,
		CreatedAt:    timestamptzToTime(row.CreatedAt),
		UpdatedAt:    timestamptzToTime(row.UpdatedAt),
	}
}

func mapRothConversionRecord(row *sqlc.RothConversion) *RothConversion {
	return &RothConversion{
		ID:          row.ID,
		UserID:      row.UserID,
		ConvertedOn: row.ConvertedOn.Time,
		Amount:      row.Amount,
		FromAssetID: uuidFromPGUUID(row.FromAssetID),
		ToAssetID:   uuidFromPGUUID(row.ToAssetID),
		Note:        row.Note,
		CreatedAt:   timestamptzToTime(row.CreatedAt),
		UpdatedAt:   timestamptzToTime(row.UpdatedAt),
	}
}
