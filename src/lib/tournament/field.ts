import { LIVE_R32_FIELD, R32_FIELD_IS_SET } from './data'
import { DEV_R32_FIELD } from './fixture.dev'

/**
 * The R32 field the app runs against. Production uses the live field —
 * which is empty until June 27, putting the editor in its pre-launch
 * "picks open June 28" state. Dev uses a plausible fixture so the full
 * flow is buildable now. (The share routes also import the fixture directly
 * for their ?demo preview, so it does ship in production bundles.)
 */
export const ACTIVE_FIELD
  = R32_FIELD_IS_SET || !import.meta.env.DEV ? LIVE_R32_FIELD : DEV_R32_FIELD

export const PICKS_ARE_OPEN = R32_FIELD_IS_SET || import.meta.env.DEV
