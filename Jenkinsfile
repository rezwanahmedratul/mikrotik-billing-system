def notifyGitHub(String stageContext, String state, String description) {
    try {
        withCredentials([usernamePassword(credentialsId: 'github-jenkins', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
            def commit = env.COMMIT_SHA ?: env.GIT_COMMIT ?: sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
            def targetUrl = env.BUILD_URL ?: 'https://jenkins.ratul.fun'
            sh """
                curl -s -X POST \
                    -H "Authorization: Bearer \$GH_TOKEN" \
                    -H "Accept: application/vnd.github.v3+json" \
                    https://api.github.com/repos/rezwanahmedratul/mikrotik-billing-system/statuses/${commit} \
                    -d '{
                        "state": "${state}",
                        "target_url": "${targetUrl}",
                        "description": "${description}",
                        "context": "jenkins/${stageContext}"
                    }' > /dev/null || true
            """
        }
    } catch (Exception e) {
        echo "Notice: GitHub status notification for '${stageContext}' skipped: ${e.message}"
    }
}

pipeline {
    agent {
        label 'docker'
    }

    environment {
        // Test environment (host is 10.0.0.48)
        TEST_HOST      = '10.0.0.48'
        TEST_USER      = 'ratul'
        TEST_DIR       = '/home/ratul/docker/mikrotik-billing-system'

        POSTGRES_IMAGE = 'postgres:16-alpine'
        REDIS_IMAGE    = 'redis:7-alpine'
        API_IMAGE      = 'mikrotik-billing-api'
        WORKER_IMAGE   = 'mikrotik-billing-worker'
        WEB_IMAGE      = 'mikrotik-billing-web'
        IMAGE_TAG      = "${env.BUILD_NUMBER}"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.COMMIT_SHA = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    def shortCommit = sh(script: 'git rev-parse --short=7 HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${shortCommit}"
                    echo "Checked out commit ${env.COMMIT_SHA} on branch: ${env.BRANCH_NAME ?: 'unknown'} (Image tag: ${env.IMAGE_TAG})"
                    notifyGitHub('pipeline', 'pending', "Pipeline running on branch ${env.BRANCH_NAME ?: 'unknown'}")
                }
            }
        }

        stage('Build Images') {
            steps {
                script {
                    notifyGitHub('build', 'pending', "Building API, Worker & Web Docker images (tag: ${env.IMAGE_TAG})...")
                }
                echo "==> Pulling base infrastructure images (Postgres & Redis)..."
                sh 'docker pull ${POSTGRES_IMAGE}'
                sh 'docker pull ${REDIS_IMAGE}'

                echo "==> Building API Docker image (tag: ${API_IMAGE}:${env.IMAGE_TAG})..."
                sh 'docker build --network=host --target api -t ${API_IMAGE}:${IMAGE_TAG} .'

                echo "==> Building Worker Docker image (tag: ${WORKER_IMAGE}:${env.IMAGE_TAG})..."
                sh 'docker build --network=host --target worker -t ${WORKER_IMAGE}:${IMAGE_TAG} .'

                echo "==> Building Web UI Docker image (tag: ${WEB_IMAGE}:${env.IMAGE_TAG})..."
                sh 'docker build --network=host --target web -t ${WEB_IMAGE}:${IMAGE_TAG} .'
                script {
                    notifyGitHub('build', 'success', 'Docker images built successfully')
                }
            }
        }

        stage('Test & Verification') {
            steps {
                script {
                    notifyGitHub('test', 'pending', 'Verifying container runtime integrity...')
                }
                echo "==> Verifying API container image integrity..."
                sh 'docker run --rm --entrypoint node ${API_IMAGE}:${IMAGE_TAG} -e "console.log(\'API Node.js runtime verified:\', process.version)"'

                echo "==> Verifying Worker container image integrity..."
                sh 'docker run --rm --entrypoint node ${WORKER_IMAGE}:${IMAGE_TAG} -e "console.log(\'Worker Node.js runtime verified:\', process.version)"'

                echo "==> Verifying Web UI container image integrity..."
                sh 'docker run --rm --entrypoint node ${WEB_IMAGE}:${IMAGE_TAG} -e "console.log(\'Web Node.js runtime verified:\', process.version)"'
                script {
                    notifyGitHub('test', 'success', 'Container verification passed (Node.js runtime verified)')
                }
            }
        }

        stage('Deploy to Test Server') {
            steps {
                script {
                    notifyGitHub('deploy', 'pending', "Streaming images directly to test server (${TEST_HOST})...")
                }
                withCredentials([sshUserPrivateKey(credentialsId: 'staging-ssh', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        set -euo pipefail

                        SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=15"

                        echo "==> Ensuring deployment directory exists on test server (${TEST_HOST})..."
                        ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "mkdir -p ${TEST_DIR}"

                        echo "==> Streaming Docker images directly to test server (${TEST_HOST})..."
                        docker save ${API_IMAGE}:${IMAGE_TAG} ${WORKER_IMAGE}:${IMAGE_TAG} ${WEB_IMAGE}:${IMAGE_TAG} ${POSTGRES_IMAGE} ${REDIS_IMAGE} | ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "docker load"

                        echo "==> Retagging deployed images to latest on test server (${TEST_HOST})..."
                        ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "
                            set -e
                            docker tag ${API_IMAGE}:${IMAGE_TAG} ${API_IMAGE}:latest
                            docker tag ${WORKER_IMAGE}:${IMAGE_TAG} ${WORKER_IMAGE}:latest
                            docker tag ${WEB_IMAGE}:${IMAGE_TAG} ${WEB_IMAGE}:latest
                            docker rmi ${API_IMAGE}:${IMAGE_TAG} ${WORKER_IMAGE}:${IMAGE_TAG} ${WEB_IMAGE}:${IMAGE_TAG} || true
                        "

                        echo "==> Transferring docker-compose.yml and .env.example to test server..."
                        scp ${SSH_OPTS} docker-compose.yml .env.example ${SSH_USER}@${TEST_HOST}:${TEST_DIR}/

                        echo "==> Launching containers via Docker Compose on test server..."
                        ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "
                            set -e
                            cd ${TEST_DIR}

                            if [ ! -f .env ]; then
                                echo 'Initializing .env from template...'
                                cp .env.example .env
                            fi

                            echo 'Starting containers via Docker Compose...'
                            if ! docker compose up -d --no-build; then
                                echo '========================================================'
                                echo 'ERROR: docker compose up failed. Dumping container logs:'
                                echo '========================================================'
                                docker compose logs postgres || true
                                docker compose logs redis || true
                                docker compose logs api --tail=100 || true
                                docker compose logs worker --tail=50 || true
                                docker compose logs web --tail=50 || true
                                docker ps -a || true
                                exit 1
                            fi

                            echo 'Pruning obsolete dangling images...'
                            docker image prune -f

                            echo 'Test server container status:'
                            docker compose ps
                        "
                    '''
                }
                script {
                    notifyGitHub('deploy', 'success', "Deployed to test server (${TEST_HOST})")
                }
            }
        }

        stage('Health Verification (Test Server)') {
            steps {
                script {
                    notifyGitHub('health-check', 'pending', 'Probing live health of Test Server API and Web UI...')
                }
                withCredentials([sshUserPrivateKey(credentialsId: 'staging-ssh', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        set -eu

                        SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=15"

                        echo "==> Probing Test Server API health (http://127.0.0.1:4000/api/v1/health)..."
                        API_HEALTHY=false
                        for i in $(seq 1 30); do
                            if ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "curl -s -f http://127.0.0.1:4000/api/v1/health >/dev/null 2>&1"; then
                                echo "SUCCESS: Test Server API is healthy and operational!"
                                API_HEALTHY=true
                                break
                            fi
                            echo "Waiting for API (attempt ${i}/30)..."
                            sleep 3
                        done

                        if [ "${API_HEALTHY}" != "true" ]; then
                            echo "ERROR: Test Server API failed health probe."
                            ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "docker compose -f ${TEST_DIR}/docker-compose.yml logs api --tail=50" || true
                            exit 1
                        fi

                        echo "==> Probing Test Server Web UI health (http://127.0.0.1:3050)..."
                        WEB_HEALTHY=false
                        for i in $(seq 1 20); do
                            if ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "curl -s -f http://127.0.0.1:3050 >/dev/null 2>&1"; then
                                echo "SUCCESS: Test Server Web UI is healthy and operational!"
                                WEB_HEALTHY=true
                                break
                            fi
                            echo "Waiting for Web UI (attempt ${i}/20)..."
                            sleep 2
                        done

                        if [ "${WEB_HEALTHY}" != "true" ]; then
                            echo "ERROR: Test Server Web UI failed health probe."
                            ssh ${SSH_OPTS} ${SSH_USER}@${TEST_HOST} "docker compose -f ${TEST_DIR}/docker-compose.yml logs web --tail=50" || true
                            exit 1
                        fi

                        echo "==> All test server services successfully verified healthy!"
                    '''
                }
                script {
                    notifyGitHub('health-check', 'success', 'All test server services healthy & operational')
                }
            }
        }
    }

    post {
        always {
            echo "==> Cleaning up build agent workspace and artifacts..."
            // Remove built Docker images created during this build run
            sh 'docker rmi ${API_IMAGE}:${IMAGE_TAG} ${WORKER_IMAGE}:${IMAGE_TAG} ${WEB_IMAGE}:${IMAGE_TAG} --force 2>/dev/null || true'
            // Prune dangling images & build cache
            sh 'docker image prune -f || true'
            sh 'docker builder prune -f || true'
            // Clean workspace directory while preserving node_modules caches across subdirectories
            cleanWs(
                cleanWhenAborted: true,
                cleanWhenFailure: true,
                cleanWhenNotBuilt: true,
                cleanWhenSuccess: true,
                cleanWhenUnstable: true,
                deleteDirs: true,
                notFailBuild: true,
                patterns: [
                    [pattern: '**/node_modules/**', type: 'EXCLUDE']
                ]
            )
        }
        success {
            script {
                notifyGitHub('pipeline', 'success', "All stages succeeded! Target: test server (${TEST_HOST})")
            }
            echo "==> Pipeline finished successfully!"
        }
        failure {
            script {
                notifyGitHub('pipeline', 'failure', 'Pipeline failed! Check Jenkins console logs.')
            }
            echo "==> Pipeline execution failed! Check logs above for details."
        }
    }
}
