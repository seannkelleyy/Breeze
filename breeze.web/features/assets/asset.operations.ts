import { graphql } from '@/lib/gql';
import type { AssetFieldsFragment, LiabilityFieldsFragment } from '@/lib/gql/graphql';

/** Domain entity types, derived from the generated fragments — these can't
 * drift from the schema. */
export type Asset = AssetFieldsFragment;
export type Liability = LiabilityFieldsFragment;

/**
 * Typed GraphQL documents, generated against breeze.api/graph/schema.graphqls
 * via `npm run codegen`. Field selections are validated at codegen time; a
 * schema change that removes a referenced field breaks the build here.
 */

export const ASSET_FIELDS = graphql(`
  fragment AssetFields on Asset {
    id
    userId
    name
    assetType
    currentValue
    contributionMode
    contributionValue
    employerMatchRate
    employerMatchMaxPercentOfSalary
    annualRate
    returnProfile
    taxTreatment
    pretaxSharePercent
    personIds
    purchaseDate
    purchasePrice
    homeGrowthProfile
    vehicleDepreciationProfile
    linkedLiabilityId
    plaidAccountId
    lastValueUpdatedAt
    createdAt
    updatedAt
  }
`);

export const LIABILITY_FIELDS = graphql(`
  fragment LiabilityFields on Liability {
    id
    userId
    name
    liabilityType
    currentBalance
    originalLoanAmount
    interestRate
    minimumPayment
    targetExtraPayment
    payoffPriority
    contributionMode
    contributionValue
    personIds
    plaidAccountId
    lastBalanceUpdatedAt
    createdAt
    updatedAt
  }
`);

export const GET_ASSETS_BY_USER = graphql(`
  query GetAssetsByUser {
    assets {
      ...AssetFields
    }
  }
`);

export const GET_LIABILITIES_BY_USER = graphql(`
  query GetLiabilitiesByUser {
    liabilities {
      ...LiabilityFields
    }
  }
`);

export const CREATE_ASSET = graphql(`
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      ...AssetFields
    }
  }
`);

export const UPDATE_ASSET = graphql(`
  mutation UpdateAsset($input: UpdateAssetInput!) {
    updateAsset(input: $input) {
      ...AssetFields
    }
  }
`);

export const CREATE_LIABILITY = graphql(`
  mutation CreateLiability($input: CreateLiabilityInput!) {
    createLiability(input: $input) {
      ...LiabilityFields
    }
  }
`);

export const UPDATE_LIABILITY = graphql(`
  mutation UpdateLiability($input: UpdateLiabilityInput!) {
    updateLiability(input: $input) {
      ...LiabilityFields
    }
  }
`);

export const DELETE_ASSET = graphql(`
  mutation DeleteAsset($id: ID!) {
    deleteAsset(id: $id)
  }
`);

export const DELETE_LIABILITY = graphql(`
  mutation DeleteLiability($id: ID!) {
    deleteLiability(id: $id)
  }
`);

export const LINK_ASSET_TO_PLAID_ACCOUNT = graphql(`
  mutation LinkAssetToPlaidAccount($assetId: ID!, $plaidAccountId: ID!) {
    linkAssetToPlaidAccount(assetId: $assetId, plaidAccountId: $plaidAccountId)
  }
`);

export const UNLINK_ASSET_FROM_PLAID_ACCOUNT = graphql(`
  mutation UnlinkAssetFromPlaidAccount($assetId: ID!) {
    unlinkAssetFromPlaidAccount(assetId: $assetId)
  }
`);

export const LINK_LIABILITY_TO_PLAID_ACCOUNT = graphql(`
  mutation LinkLiabilityToPlaidAccount($liabilityId: ID!, $plaidAccountId: ID!) {
    linkLiabilityToPlaidAccount(liabilityId: $liabilityId, plaidAccountId: $plaidAccountId)
  }
`);

export const UNLINK_LIABILITY_FROM_PLAID_ACCOUNT = graphql(`
  mutation UnlinkLiabilityFromPlaidAccount($liabilityId: ID!) {
    unlinkLiabilityFromPlaidAccount(liabilityId: $liabilityId)
  }
`);
