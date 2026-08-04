pipeline {
agent any

```
stages {

    stage('Checkout') {
        steps {
            echo 'Checking out Smart Health Manager source code...'
            checkout scm
        }
    }

    stage('Prepare Frontend') {
        steps {
            echo 'Preparing frontend files...'

            bat '''
                if not exist public mkdir public

                if exist index.html copy /Y index.html public\\index.html
                if exist app.js copy /Y app.js public\\app.js
                if exist style.css copy /Y style.css public\\style.css

                echo Frontend files prepared successfully.
            '''
        }
    }

    stage('Install Backend Dependencies') {
        steps {
            echo 'Installing Node.js dependencies...'

            bat '''
                npm install
            '''
        }
    }

    stage('Validate Backend') {
        steps {
            echo 'Checking server.js syntax...'

            bat '''
                node --check server.js
            '''
        }
    }

    stage('Validate Frontend JavaScript') {
        steps {
            echo 'Checking frontend JavaScript syntax...'

            bat '''
                node --check public\\app.js
            '''
        }
    }

    stage('Build') {
        steps {
            echo 'Building Smart Health Manager...'

            bat '''
                if not exist public\\index.html exit /b 1
                if not exist public\\app.js exit /b 1
                if not exist public\\style.css exit /b 1

                echo Frontend build files verified.
                echo Backend files verified.
            '''
        }
    }

    stage('Application Smoke Test') {
        steps {
            echo 'Starting application for smoke test...'

            powershell '''
                $process = Start-Process -FilePath "node" `
                    -ArgumentList "server.js" `
                    -PassThru `
                    -WindowStyle Hidden

                Start-Sleep -Seconds 5

                try {
                    $response = Invoke-WebRequest `
                        -Uri "http://localhost:3000" `
                        -UseBasicParsing

                    if ($response.StatusCode -ne 200) {
                        throw "Application returned HTTP status $($response.StatusCode)"
                    }

                    Write-Host "Application smoke test passed."
                }
                finally {
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                }
            '''
        }
    }

    stage('Deploy') {
        steps {
            echo 'Build and validation completed.'
            echo 'Deployment can now be triggered through Render/GitHub.'
        }
    }
}

post {
    success {
        echo '=========================================='
        echo 'SMART HEALTH MANAGER PIPELINE SUCCESSFUL'
        echo '=========================================='
    }

    failure {
        echo '=========================================='
        echo 'SMART HEALTH MANAGER PIPELINE FAILED'
        echo 'Check the Console Output for the error.'
        echo '=========================================='
    }
}
```

}

