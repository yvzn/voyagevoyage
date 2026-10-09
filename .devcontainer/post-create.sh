#!/usr/bin/env bash
set -euo pipefail

curl -sSL https://aspire.dev/install.sh | bash
echo 'export PATH="$HOME/.aspire/bin:$PATH"' >> ~/.bashrc

dotnet dev-certs https || true

npm install -g azure-functions-core-tools@4 --unsafe-perm true

(cd front && npm ci)
(cd apphost && npm ci)
