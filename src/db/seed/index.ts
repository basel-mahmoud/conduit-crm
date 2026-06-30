/**
 * Database seed entrypoint.
 * Real seed (org, system roles, permission matrix, demo data) lands in M2
 * alongside the RBAC implementation.
 */
async function main() {
  console.log("Conduit seed — nothing to seed yet (RBAC seed arrives in M2).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
