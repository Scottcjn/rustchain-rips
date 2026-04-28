# Contributing to [Project Name]

Thank you for contributing to this project! Please follow these guidelines to help keep the codebase consistent and the review process smooth.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/REPO_NAME.git`
3. **Create** a feature branch: `git checkout -b feature/your-feature-name`
4. **Make** your changes and test them
5. **Submit** a pull request

## Code Style

- **Python**: Follow PEP 8; run `black .` and `ruff check .` before committing
- **JavaScript/TypeScript**: Use ESLint with the standard config
- **Shell scripts**: Use shellcheck and follow POSIX conventions
- **Commit messages**: Use clear, descriptive messages; prefix with type (`feat:`, `fix:`, `docs:`, `test:`)

## Pull Request Guidelines

- One PR per feature or fix — keep changes focused and reviewable
- Reference the related bounty or issue in your PR description
- Include tests for new functionality
- Ensure all existing tests pass
- For bounties: add the bounty number to the PR title (e.g., `feat: feature name (bounty #1234)`)

## Testing

```bash
# Run all tests
pytest .

# Run with coverage
pytest --cov=. --cov-report=term-missing
```

## Reporting Issues

- Search existing issues before opening a new one
- Include environment info (OS, Python version, etc.)
- For bugs: include steps to reproduce and expected vs actual behavior
- For feature requests: describe the use case and proposed solution

## License

By submitting a pull request, you agree that your contributions will be licensed under the project's MIT license.
