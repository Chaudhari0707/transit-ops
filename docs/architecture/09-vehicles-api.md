# Vehicles API & UI

## HTTP API (`/api/vehicles`) — ODO-22

Auth: Better Auth session cookie. Send `Origin` matching `BETTER_AUTH_TRUSTED_ORIGINS` for browser/curl CSRF.

| Method   | Path                | Role                    | Notes                              |
| -------- | ------------------- | ----------------------- | ---------------------------------- |
| `GET`    | `/api/vehicles`     | FM, Dispatcher, Finance | Query: `vehicleTypeId?`, `status?` |
| `GET`    | `/api/vehicles/:id` | FM, Dispatcher, Finance | Soft-deleted → 404                 |
| `POST`   | `/api/vehicles`     | Fleet Manager           | Status always starts `available`   |
| `PUT`    | `/api/vehicles/:id` | Fleet Manager           | Manual status: `retired` only      |
| `DELETE` | `/api/vehicles/:id` | Fleet Manager           | Soft-delete (`deleted_at`)         |

**RBAC:** `safety_officer` → 403 on all vehicle routes.

**Rules:** unique registration; retire/delete blocked while `on_trip`; cannot set `on_trip`/`in_shop` via registry.

### Create body

```json
{
  "registrationNumber": "GJ-01-VA-1005",
  "nameModel": "Van-05",
  "vehicleTypeId": "<uuid>",
  "maxLoadCapacityKg": 1200,
  "odometerKm": 0,
  "acquisitionCostInr": 850000,
  "notes": "optional"
}
```

### Errors

Mapped by `src/lib/api/errors.ts`: `Unauthorized`→401, `Forbidden`→403, `* not found`→404, `Conflict:*`→409, else 400.

## UI (`/dashboard/vehicles`) — ODO-23

- Table: reg, name/model, type, capacity, odometer, acquisition cost, status
- Filters: type + status (no region)
- Banner: unique reg; Retired/In Shop hidden from dispatch
- Write UI (add/edit/retire/delete) only when server session role is `fleet_manager`
- Form: RHF + Zod (`_lib/vehicle-schema.ts`); server re-validates

## Unit tests

| Suite                              | Path                                    |
| ---------------------------------- | --------------------------------------- |
| RBAC / status / registration rules | `test/modules/vehicles/*.test.ts`       |
| API error map                      | `test/lib/api/errors.test.ts`           |
| UI schema / helpers                | `test/app/dashboard/vehicles/*.test.ts` |

## Curl (PowerShell)

Use a JSON file body and Origin header — see prior session notes or:

```powershell
bun -e "await Bun.write('body.json', JSON.stringify({email:'admin@example.com',password:'ChangeMe123!'}))"
curl.exe -c cookies.txt -b cookies.txt -X POST http://127.0.0.1:3000/api/auth/sign-in/email -H "Content-Type: application/json" -H "Origin: http://127.0.0.1:3000" --data-binary "@body.json"
curl.exe -b cookies.txt -H "Origin: http://127.0.0.1:3000" http://127.0.0.1:3000/api/vehicles
```
