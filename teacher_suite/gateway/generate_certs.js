const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');
const opensslPath = 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe';

function generateCerts() {
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const caKey = path.join(certsDir, 'ca.key');
  const caCrt = path.join(certsDir, 'ca.crt');
  const gatewayKey = path.join(certsDir, 'gateway.key');
  const gatewayCsr = path.join(certsDir, 'gateway.csr');
  const gatewayCrt = path.join(certsDir, 'gateway.crt');
  const gatewayExt = path.join(certsDir, 'gateway.ext');
  const agentKey = path.join(certsDir, 'agent.key');
  const agentCsr = path.join(certsDir, 'agent.csr');
  const agentCrt = path.join(certsDir, 'agent.crt');
  const agentPfx = path.join(certsDir, 'agent.pfx');

  if (fs.existsSync(caCrt) && fs.existsSync(gatewayCrt) && fs.existsSync(agentPfx)) {
    console.log('✅ Chứng chỉ mTLS đã tồn tại sẵn trong gateway/certs/');
    return;
  }

  console.log('⏳ Đang khởi tạo Local Lab Root CA & mTLS X.509 Certificates...');

  // 1. Root CA (Valid 5 years)
  execSync(`"${opensslPath}" genrsa -out "${caKey}" 4096`, { stdio: 'ignore' });
  execSync(`"${opensslPath}" req -x509 -new -nodes -key "${caKey}" -sha256 -days 1825 -out "${caCrt}" -subj "/CN=CVALMS-Lab-Root-CA/O=CVALMS-Edu/C=VN"`, { stdio: 'ignore' });

  // 2. Gateway Server Cert (with SANs for localhost, 127.0.0.1, and private IPs)
  const extContent = `
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = cvalms-gateway.local
IP.1 = 127.0.0.1
IP.2 = 0.0.0.0
`;
  fs.writeFileSync(gatewayExt, extContent.trim(), 'utf8');

  execSync(`"${opensslPath}" genrsa -out "${gatewayKey}" 2048`, { stdio: 'ignore' });
  execSync(`"${opensslPath}" req -new -key "${gatewayKey}" -out "${gatewayCsr}" -subj "/CN=CVALMS-Lab-Gateway/O=CVALMS-Edu/C=VN"`, { stdio: 'ignore' });
  execSync(`"${opensslPath}" x509 -req -in "${gatewayCsr}" -CA "${caCrt}" -CAkey "${caKey}" -CAcreateserial -out "${gatewayCrt}" -days 730 -sha256 -extfile "${gatewayExt}"`, { stdio: 'ignore' });

  // 3. Agent Client Cert (for Windows C# Agent)
  execSync(`"${opensslPath}" genrsa -out "${agentKey}" 2048`, { stdio: 'ignore' });
  execSync(`"${opensslPath}" req -new -key "${agentKey}" -out "${agentCsr}" -subj "/CN=CVALMS-Student-Agent/O=CVALMS-Edu/C=VN"`, { stdio: 'ignore' });
  execSync(`"${opensslPath}" x509 -req -in "${agentCsr}" -CA "${caCrt}" -CAkey "${caKey}" -CAcreateserial -out "${agentCrt}" -days 730 -sha256`, { stdio: 'ignore' });

  // Export Agent cert to PFX format (password-free or standard password 'cvalms2026')
  execSync(`"${opensslPath}" pkcs12 -export -out "${agentPfx}" -inkey "${agentKey}" -in "${agentCrt}" -certfile "${caCrt}" -passout pass:cvalms2026`, { stdio: 'ignore' });

  // Clean temp CSR & ext files
  try {
    fs.unlinkSync(gatewayCsr);
    fs.unlinkSync(agentCsr);
    fs.unlinkSync(gatewayExt);
  } catch (e) {
    // ignore
  }

  console.log('✅ Khởi tạo thành công bộ chứng chỉ mTLS X.509 SChannel trong gateway/certs/');
}

if (require.main === module) {
  generateCerts();
}

module.exports = { generateCerts, certsDir };
