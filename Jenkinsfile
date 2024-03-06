#!groovy

node('executor') {
  checkout scm

  def authorName  = sh(returnStdout: true, script: 'git --no-pager show --format="%an" --no-patch')
  def isMain    = env.BRANCH_NAME == "main"
  def serviceName = env.JOB_NAME.tokenize("/")[1]

  def commitHash  = sh(returnStdout: true, script: 'git rev-parse HEAD | cut -c-7').trim()
  def imageTag    = "${env.BUILD_NUMBER}-${commitHash}"

  def pennsieveNexusCreds = usernamePassword(
    credentialsId: "pennsieve-nexus-ci-login",
    usernameVariable: "PENNSIEVE_NEXUS_USER",
    passwordVariable: "PENNSIEVE_NEXUS_PW"
  )

  try {
    stage("Test Setup") {
      sh """#!/bin/bash -ex
          . $HOME/.nvm/nvm.sh ; nvm use 14
          node -v
          npm -v
          npm run test:ci:build"""
    }

    stage("Test Run") {
      sh """#!/bin/bash -ex
              . $HOME/.nvm/nvm.sh ; nvm use 14
              node -v
              npm -v
              npm run test:ci:run"""
    }

    stage("Test Cleanup") {
      sh """#!/bin/bash -ex
                  . $HOME/.nvm/nvm.sh ; nvm use 14
                  node -v
                  npm -v
                  npm run test:ci:clean"""
    }

    if (isMain) {
      stage("Build") {
        sh "docker build . -t pennsieve/${serviceName}:latest -t pennsieve/${serviceName}:${imageTag}"
      }

      stage("Publish") {
          sh "docker push pennsieve/${serviceName}:latest"
          sh "docker push pennsieve/${serviceName}:${imageTag}"
      }

      stage("Deploy") {
        build job: "service-deploy/pennsieve-non-prod/us-east-1/dev-vpc-use1/dev/${serviceName}",
        parameters: [
          string(name: 'IMAGE_TAG', value: imageTag),
          string(name: 'TERRAFORM_ACTION', value: 'apply')
        ]
      }
    }
  } catch (e) {
    echo 'ERROR: ' + e.toString()
    slackSend(color: '#b20000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) by ${authorName}")
    throw e
  }

  slackSend(color: '#006600', message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) by ${authorName}")
}
