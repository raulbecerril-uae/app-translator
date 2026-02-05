# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | ✅ Yes             |
| 1.x.x   | ⚠️ Limited Support |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues privately by:

1. **Email**: Send details to `raulbecerril.uae@gmail.com`
2. **Subject**: Include `[SECURITY]` in the subject line
3. **Details**: Provide as much information as possible

### 📋 What to Include

Please include the following information in your report:

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and attack scenarios
- **Reproduction**: Step-by-step instructions to reproduce
- **Environment**: Browser, OS, Node.js version, etc.
- **Proof of Concept**: Code or screenshots (if applicable)
- **Suggested Fix**: If you have ideas for a fix

### 🕐 Response Timeline

We will acknowledge receipt of your vulnerability report within **48 hours** and provide a more detailed response within **7 days**.

Our security response process:

1. **Acknowledgment** (within 48 hours)
2. **Investigation** (within 7 days)
3. **Fix Development** (timeline depends on severity)
4. **Testing & Validation**
5. **Release & Disclosure**

### 🏆 Recognition

We appreciate security researchers who help keep our project safe. With your permission, we will:

- Credit you in our security advisories
- Add you to our security contributors list
- Provide a reference for responsible disclosure

## Security Considerations

### 🎤 Microphone Access

- **Browser Permissions**: The application requires microphone access for speech recognition
- **Data Processing**: Audio is processed locally and via WebSocket to the server
- **No Recording**: Audio is not permanently stored or recorded
- **Temporary Files**: Audio buffers are temporarily processed and immediately discarded

### 🌐 Network Communication

- **WebSocket Security**: All WebSocket communication should use WSS in production
- **API Calls**: Translation APIs are called server-side to protect API keys
- **CORS**: Properly configured Cross-Origin Resource Sharing
- **Input Validation**: All user inputs are validated and sanitized

### 🔑 API Keys & Secrets

- **Environment Variables**: API keys stored in environment variables
- **No Client Exposure**: API keys never exposed to client-side code
- **Rotation**: Regular rotation of API keys recommended
- **Rate Limiting**: API usage monitored and rate-limited

### 🛡️ Common Vulnerabilities

We actively monitor and protect against:

- **XSS (Cross-Site Scripting)**: Input sanitization and CSP headers
- **Injection Attacks**: Parameterized queries and input validation
- **CSRF**: CSRF tokens for state-changing operations
- **DoS**: Rate limiting and resource monitoring
- **Data Exposure**: Minimal data collection and secure transmission

## Security Best Practices

### For Users

- **HTTPS Only**: Always use HTTPS in production
- **Browser Updates**: Keep your browser updated
- **Permissions**: Review microphone permissions regularly
- **Network**: Use secure networks for sensitive translations

### For Developers

- **Dependencies**: Regularly update dependencies
- **Secrets**: Never commit API keys or secrets
- **Validation**: Validate all inputs server-side
- **Logging**: Avoid logging sensitive information
- **HTTPS**: Use HTTPS and WSS in production

### For Deployment

- **Environment**: Use production environment variables
- **Firewall**: Configure proper firewall rules
- **Monitoring**: Implement security monitoring
- **Backups**: Regular security-focused backups
- **Updates**: Keep server and dependencies updated

## Vulnerability Categories

### High Severity
- Remote code execution
- Authentication bypass
- Data exposure of sensitive information
- Privilege escalation

### Medium Severity
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Information disclosure
- Denial of service

### Low Severity
- Minor information leaks
- Non-exploitable bugs
- Configuration issues

## Security Tools

We use various tools to maintain security:

- **Dependency Scanning**: `npm audit` for known vulnerabilities
- **Code Analysis**: Static analysis for security issues
- **Penetration Testing**: Regular security assessments
- **Monitoring**: Runtime security monitoring

## Contact Information

For security-related questions or concerns:

- **Security Email**: raulbecerril.uae@gmail.com
- **Subject Line**: Include `[SECURITY]` prefix
- **Response Time**: Within 48 hours
- **PGP Key**: Available upon request

## Legal

This security policy is subject to our terms of service and privacy policy. By reporting vulnerabilities, you agree to:

- Provide reasonable time for fixes before public disclosure
- Not access or modify data beyond what's necessary to demonstrate the vulnerability
- Not perform attacks that could harm the service or its users

Thank you for helping keep our project secure! 🔒