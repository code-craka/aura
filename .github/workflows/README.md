# Security Workflows

This directory contains GitHub Actions workflows for automated security scanning and compliance checking for the Project Aura monorepo.

## Available Workflows

### 1. CodeQL Security Scan (`codeql-security-scan.yml`)

**Comprehensive security scanning workflow that runs on:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly schedule (Mondays at 6 AM UTC)
- Manual trigger

**Features:**

- CodeQL analysis for JavaScript/TypeScript code
- Dependency vulnerability scanning with npm audit
- Container/file system scanning with Trivy
- License compliance checking
- Automated PR comments with security findings
- Upload results to GitHub Security tab

### 2. CodeQL Basic Analysis (`codeql-basic.yml`)

**Lightweight CodeQL analysis that runs on:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly schedule

**Features:**

- CodeQL security and quality analysis
- JavaScript/TypeScript code scanning
- Results uploaded to GitHub Security tab

### 3. Dependency Check (`dependency-check.yml`)

**Dependency review workflow that runs on:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Features:**

- Automated dependency review
- Security vulnerability detection in dependencies
- License compatibility checking
- Fails build on moderate or higher severity vulnerabilities

### 4. CI/CD Pipeline (`ci-cd.yml`)

**Complete CI/CD pipeline with security integration that runs on:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Features:**

- Test execution and build
- Security scanning integration
- CodeQL analysis
- Automated deployment to staging (develop branch)
- Automated deployment to production (main branch)

### 5. License Compliance (`license-check.yml`)

**License compliance checking workflow that runs on:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly schedule

**Features:**

- Comprehensive license scanning
- Detection of prohibited licenses (GPL, LGPL, AGPL, etc.)
- Automated PR comments
- License report generation

## Security Reports

All security workflows generate reports in the `security-reports/` directory:

- `npm-audit.json` - NPM security audit results
- `trivy-results.sarif` - Trivy vulnerability scan results
- `license-report.json` - License compliance data
- `license-summary.txt` - License summary
- `license-report.csv` - License data in CSV format
- `license-report.md` - Human-readable license report
- `security-summary.md` - Overall security scan summary

## GitHub Security Tab

Security scan results are automatically uploaded to GitHub's Security tab where you can:

- View detailed vulnerability information
- Track security trends over time
- Manage security alerts
- Set up security policies
- Integrate with other security tools

## Configuration

### Required Permissions

The workflows require the following GitHub permissions:

- `contents: read` - Read repository contents
- `security-events: write` - Upload security scan results
- `pull-requests: write` - Comment on pull requests
- `actions: read` - Read workflow and action metadata
- `deployments: write` - Create deployment statuses

### Environment Variables

No environment variables are required for basic functionality. However, you may want to configure:

- `NODE_ENV` - Environment for Node.js builds
- `CI` - Set to `true` for CI environment

### Customizing Scan Behavior

#### CodeQL Configuration

Edit the `queries` parameter in CodeQL workflows to customize scan behavior:

```yaml
queries: security-extended,security-and-quality
```

#### Vulnerability Severity Threshold

Modify the `fail-on-severity` parameter in dependency checks:

```yaml
fail-on-severity: moderate  # Options: low, moderate, high, critical
```

#### License Checking

Customize prohibited licenses in `license-check.yml`:

```bash
PROHIBITED_LICENSES=("GPL" "LGPL" "AGPL" "CC-BY-SA" "CC-BY-NC")
```

## Usage

### Running Workflows Manually

1. Go to the Actions tab in your GitHub repository
2. Select the desired workflow
3. Click "Run workflow"
4. Choose the branch to run on

### Viewing Results

1. **Security Tab**: Go to Security → Code scanning alerts
2. **Workflow Runs**: Go to Actions tab to see workflow execution details
3. **Artifacts**: Download security reports from workflow run artifacts
4. **PR Comments**: Security findings are automatically commented on pull requests

### Troubleshooting

#### Common Issues

**Workflow fails with permission errors:**

- Ensure the repository has the required permissions enabled
- Check that the workflows have the necessary permissions declared

**CodeQL analysis fails:**

- Ensure Node.js version is compatible (currently set to 20)
- Check that the build process completes successfully
- Verify that dependencies install correctly

**Dependency scan finds false positives:**

- Review the specific vulnerabilities
- Consider excluding development-only dependencies
- Update dependencies to patched versions

**License check fails:**

- Review the license compatibility requirements
- Consider replacing dependencies with incompatible licenses
- Update the prohibited licenses list if needed

## Integration with Other Tools

### IDE Integration

- Install the GitHub CodeQL extension in VS Code
- Use the SARIF viewer to examine security reports locally

### External Security Tools

- Integrate with tools like Snyk, Dependabot, or WhiteSource
- Use the generated SARIF files for import into other security platforms
- Set up webhooks to send alerts to security monitoring systems

### Compliance Automation

- Use the license reports for compliance documentation
- Integrate with policy-as-code tools like Open Policy Agent
- Automate compliance reporting for audits

## Best Practices

1. **Regular Updates**: Keep dependencies updated to avoid known vulnerabilities
2. **Review Alerts**: Regularly review and address security alerts
3. **Test Changes**: Always test security-related changes thoroughly
4. **Documentation**: Document security decisions and exceptions
5. **Training**: Ensure team members understand security workflows

## Support

For issues with these workflows:

1. Check the Actions tab for error details
2. Review the security reports in the artifacts
3. Consult GitHub's security documentation
4. Open an issue in the repository for workflow-specific problems
