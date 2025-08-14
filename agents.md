# Build and start the Docker containers defined in the project.
docker compose up -d --build

# Optional but recommended: Verify the setup by running the test suite.
docker compose exec app bin/rails lca:test 
