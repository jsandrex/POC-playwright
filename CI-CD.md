# How CI/CD works in this project

## CI and CD

**Continuous integration (CI)** automatically checks proposed code changes. In
this project, Jenkins checks out the repository, installs the locked Node.js
dependencies, and runs the Playwright tests in Chromium, Firefox, and WebKit.
Jenkins reports whether the checks passed and keeps the test reports.

**Continuous delivery/deployment (CD)** takes validated changes and prepares
or deploys them to an environment. This repository does not currently build or
deploy an application: it contains browser and API tests, not an application
or deployment configuration. The pipeline described here is CI, not
application deployment.

## What happens when code changes

```text
Push or pull request
        |
        v
Git provider notifies Jenkins (or Jenkins discovers the branch)
        |
        v
Jenkins checks out the branch and reads Jenkinsfile
        |
        v
Start Playwright Docker image
        |
        v
npm ci  --> install exact dependency versions from package-lock.json
        |
        v
npm test --> run tests in Chromium, Firefox, and WebKit
        |
        v
Publish JUnit results and archive HTML report and test artifacts
```

The push/pull-request notification or branch discovery must be configured in
Jenkins and the Git provider; the `Jenkinsfile` alone does not create that
connection. See [Jenkins setup](README.md#jenkins-setup) for the prerequisites.

## Step-by-step: push, review, and merge a change

Jenkins tests the code that Git receives; it does not push code or merge
branches for you. Use Git to push changes and your Git provider (for example,
GitHub) to create and merge pull requests.

### One-time Jenkins and Git setup

Ask a Jenkins administrator to confirm these items before relying on automatic
builds:

1. Jenkins has a **Multibranch Pipeline** job for this repository, with the
   correct Git repository URL and credentials if it is private.
2. Branch discovery and pull-request discovery are enabled for the Git
   provider. For GitHub, this is normally configured through the Jenkins GitHub
   Branch Source integration.
3. Push and pull-request webhooks notify Jenkins, or multibranch indexing is
   scheduled. Without either, Jenkins might not start a build immediately.
4. Jenkins agents can run Docker, pull the Playwright image, and reach the
   external sites tested by this project.
5. If you want Jenkins results displayed as pull-request checks, configure the
   Git provider integration to publish build status. The `Jenkinsfile` runs
   the tests but does not itself configure GitHub status checks or merge rules.

### 1. Create a working branch

Start from the latest version of the shared default branch (usually `main`):

```sh
git switch main
git pull origin main
git switch -c feature/short-description
```

Use your repository's actual default branch name if it is not `main`. Give the
branch a short name that describes the change.

### 2. Make and check your changes

Edit the code or tests, then run the checks locally from the repository root:

```sh
npm ci
npm test
```

Review the results and fix failures before asking others to review. `npm ci`
installs dependencies from the lock file; it does not need to be repeated for
every change if dependencies have not changed.

### 3. Commit and push the branch

Stage only the files that belong to your change, commit them, and push the
branch to the remote:

```sh
git status
git add <file-or-folder>
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Replace `<file-or-folder>` and `feature/short-description` with your paths and
branch name. The first push uses `-u` to connect your local branch to its
remote branch. Later updates can generally be pushed with:

```sh
git add <file-or-folder>
git commit -m "Describe the update"
git push
```

### 4. Check the Jenkins branch build

After the push, Jenkins should discover the branch and start a build. In
Jenkins:

1. Open the repository's Multibranch Pipeline job.
2. Select your branch and its newest build. If no build appears, ask the
   Jenkins administrator to check webhook delivery or run **Scan Multibranch
   Pipeline Now**.
3. Open the build and watch **Console Output** or the stage view. The pipeline
   should complete **Install dependencies** and **Run Playwright tests**.
4. Confirm the build succeeded. Open **Test Result** to review JUnit results.
   If needed, download the archived `playwright-report` artifact and open
   `index.html`.

If the build fails, use the failed stage and console output to identify the
cause. Fix the issue on your branch, commit, and push again. The new push
should start a fresh build; wait for that build before continuing.

### 5. Open a pull request

In your Git provider, create a pull request with your working branch as the
source and the shared default branch (usually `main`) as the target. Add a
clear title and description, then request the required reviews.

If pull-request discovery is configured, Jenkins should also build the
pull-request revision. Wait for that build to finish. Reviewers should use the
latest pull-request build result, not an older branch build. If Jenkins results
do not appear in the pull request, the Jenkins/Git provider status integration
may not be configured even if Jenkins ran the build.

### 6. Review and merge

Before merging, confirm that:

1. The latest pull-request build passed.
2. Required reviews and any repository policies are satisfied.
3. The pull request contains the expected commits and changes.

Merge the pull request using the Git provider's merge button and the merge
method approved by your team. Do not merge a failing build; fix the issue,
push the correction, and wait for the updated pull-request build to pass.

The merge updates the shared branch in Git. Jenkins may run another build for
the updated default branch if branch builds are enabled. This project's
pipeline does not automatically deploy the merged code.

### 7. Update your local repository

After the pull request is merged, update your local default branch and remove
the finished working branch:

```sh
git switch main
git pull origin main
git branch -d feature/short-description
```

If your Git provider has already deleted the remote branch, remove its stale
remote-tracking reference with:

```sh
git fetch --prune
```

## Pipeline stages

The pipeline is defined in [`Jenkinsfile`](Jenkinsfile).

1. **Agent:** Jenkins runs the job inside
   `mcr.microsoft.com/playwright:v1.64.0-noble`. This image includes the browser
   dependencies required by Playwright. Its Playwright version matches the
   version locked in `package-lock.json`.
2. **Install dependencies:** `npm ci` installs the exact versions in the lock
   file. It gives CI a reproducible install and fails if the package manifest
   and lock file do not agree.
3. **Run tests:** `npm test` runs `playwright test`. The tests run against all
   three configured browser projects.
4. **Publish results:** Whether the test stage succeeds or fails, Jenkins
   attempts to publish `test-results/junit.xml` as test results and archive
   files under `playwright-report/` and `test-results/`.

The pipeline sets `CI=true`. In CI, Playwright disallows `test.only`, retries
failed tests twice, uses one worker, and writes list, JUnit, and HTML reports.
The overall Jenkins build is marked failed if the install or test command
fails; publishing the reports does not turn a failed test run into a success.
The pipeline also adds timestamps to the log and stops a build after 30
minutes.

## Reading a Jenkins build

- **Successful build:** dependency installation and the test command completed
  successfully. Review the test results to see how many tests ran.
- **Failed build:** open the failed stage and console output to locate the
  installation or test error. Jenkins' JUnit results show failed tests and
  their error details. A failed test can still leave an HTML report and other
  artifacts available.
- **JUnit results:** open the build's **Test Result** page or test-results
  section in Jenkins. These results are machine-readable and can be tracked
  across builds.
- **HTML report:** download the archived `playwright-report` folder from the
  build artifacts and open `index.html` in a browser. The report contains
  detailed test results; `test-results` also contains supporting artifacts,
  such as traces collected on the first retry.

## Running the same checks locally

From the repository root, run:

```sh
npm ci
npm test
```

To open the locally generated HTML report, run:

```sh
npm run test:report
```

Local runs use the HTML reporter. Jenkins enables the additional JUnit
reporter by setting `CI=true`.

## Important requirements and limitations

- The Jenkins agent needs Docker access, permission to pull the Playwright
  image, and network access to the external websites and APIs used by the
  tests.
- Keep the Playwright Docker image version in `Jenkinsfile` aligned with
  `@playwright/test` in `package-lock.json` when upgrading Playwright.
- This pipeline does not publish an application, deploy to an environment, or
  require deployment credentials. Add a deployment stage only when the
  application, target environment, and release requirements are defined.
