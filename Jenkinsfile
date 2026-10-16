pipeline {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.64.0-noble'
    }
  }

  environment {
    CI = 'true'
  }

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Run Playwright tests') {
      steps {
        sh 'npm test'
      }
    }
  }

  post {
    always {
      script {
        if (fileExists('test-results/junit.xml')) {
          junit 'test-results/junit.xml'
        }
      }
      archiveArtifacts artifacts: 'playwright-report/**, test-results/**', allowEmptyArchive: true
    }
  }
}
