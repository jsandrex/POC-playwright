# Playwright tests with Jenkins

This repository runs its Playwright suite in Chromium, Firefox, and WebKit
through the `Jenkinsfile`. The pipeline installs dependencies with `npm ci`,
runs `npm test`, publishes JUnit test results, and archives the Playwright HTML
report and test artifacts.

For a step-by-step explanation of CI/CD in this project, see
[How CI/CD works](CI-CD.md).

## Jenkins setup

1. Use a Linux Jenkins agent with Docker available and install the **Docker
   Pipeline** plugin. The agent must be able to pull Docker images and access
   the public websites exercised by the tests.
2. Create a **Multibranch Pipeline** job pointing at this Git repository. For a
   private repository, configure the appropriate SCM credentials in Jenkins.
3. Configure your Git provider to send push and pull-request events to Jenkins,
   or configure branch indexing in the multibranch job.
4. Jenkins will discover the `Jenkinsfile` and run the pipeline for indexed
   branches and pull requests. The Playwright Docker image version is pinned to
   the `@playwright/test` version in `package-lock.json`; keep them in sync when
   upgrading Playwright.
5. Open a build to view the published test results. Download the archived
   `playwright-report/index.html` artifact for the interactive HTML report.

This pipeline validates the test suite; it does not deploy an application.
