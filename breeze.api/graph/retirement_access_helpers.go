package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
)

func mapHsaReceiptToModel(r *service.HsaReceipt) *model.HsaReceipt {
	return &model.HsaReceipt{
		ID:          r.ID.String(),
		UserID:      r.UserID.String(),
		IncurredOn:  r.IncurredOn.Format("2006-01-02"),
		Description: r.Description,
		Amount:      r.Amount.String(),
		CreatedAt:   r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   r.UpdatedAt.Format(time.RFC3339),
	}
}

func mapHsaReimbursementToModel(r *service.HsaReimbursement) *model.HsaReimbursement {
	return &model.HsaReimbursement{
		ID:           r.ID.String(),
		UserID:       r.UserID.String(),
		ReimbursedOn: r.ReimbursedOn.Format("2006-01-02"),
		Amount:       r.Amount.String(),
		Note:         r.Note,
		CreatedAt:    r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    r.UpdatedAt.Format(time.RFC3339),
	}
}

func mapRothConversionToModel(c *service.RothConversion) *model.RothConversion {
	return &model.RothConversion{
		ID:          c.ID.String(),
		UserID:      c.UserID.String(),
		ConvertedOn: c.ConvertedOn.Format("2006-01-02"),
		Amount:      c.Amount.String(),
		FromAssetID: uuidStringPtr(c.FromAssetID),
		ToAssetID:   uuidStringPtr(c.ToAssetID),
		Note:        c.Note,
		CreatedAt:   c.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   c.UpdatedAt.Format(time.RFC3339),
	}
}

func mapHsaSummaryToModel(s *service.HsaLadderSummary) *model.HsaLadderSummary {
	return &model.HsaLadderSummary{
		TotalReceipts:        s.TotalReceipts.String(),
		TotalReimbursed:      s.TotalReimbursed.String(),
		AvailableToReimburse: s.AvailableToReimburse.String(),
	}
}

func mapRothBucketToModel(b *service.RothConversionBucket) *model.RothConversionBucket {
	return &model.RothConversionBucket{
		Year:        b.Year,
		Amount:      b.Amount.String(),
		AvailableOn: b.AvailableOn.Format("2006-01-02"),
		Accessible:  b.Accessible,
	}
}

func mapRetirementAccessToModel(a *service.RetirementAccess) *model.RetirementAccess {
	out := &model.RetirementAccess{
		HsaReceipts:       make([]*model.HsaReceipt, 0, len(a.HsaReceipts)),
		HsaReimbursements: make([]*model.HsaReimbursement, 0, len(a.HsaReimbursements)),
		HsaSummary:        mapHsaSummaryToModel(&a.HsaSummary),
		RothConversions:   make([]*model.RothConversion, 0, len(a.RothConversions)),
		RothBuckets:       make([]*model.RothConversionBucket, 0, len(a.RothBuckets)),
	}
	for i := range a.HsaReceipts {
		out.HsaReceipts = append(out.HsaReceipts, mapHsaReceiptToModel(&a.HsaReceipts[i]))
	}
	for i := range a.HsaReimbursements {
		out.HsaReimbursements = append(out.HsaReimbursements, mapHsaReimbursementToModel(&a.HsaReimbursements[i]))
	}
	for i := range a.RothConversions {
		out.RothConversions = append(out.RothConversions, mapRothConversionToModel(&a.RothConversions[i]))
	}
	for i := range a.RothBuckets {
		out.RothBuckets = append(out.RothBuckets, mapRothBucketToModel(&a.RothBuckets[i]))
	}
	return out
}

func uuidStringPtr(id *uuid.UUID) *string {
	if id == nil {
		return nil
	}
	s := id.String()
	return &s
}

// optionalAssetID parses an optional GraphQL ID, treating empty as absent.
func optionalAssetID(value *string) (*uuid.UUID, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	parsed, err := uuid.Parse(*value)
	if err != nil {
		return nil, fmt.Errorf("invalid asset id: %w", err)
	}
	return &parsed, nil
}
