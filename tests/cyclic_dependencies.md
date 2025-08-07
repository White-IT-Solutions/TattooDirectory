──────────────────────────────────
Project: infrastructure-environments-dev
Module path: infrastructure/environments/dev
Workspace: dev
Errors:
Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_lambda_function.api_handler -> aws_opensearch_domain.main -> aws_security_group.opensearch -> aws_security_group.lambda -> aws_security_group.opensearch

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_lambda_function.api_handler -> aws_opensearch_domain.main -> aws_security_group.opensearch -> aws_security_group.lambda -> aws_security_group.vpc_endpoints -> aws_security_group.fargate -> aws_security_group.vpc_endpoints

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_lambda_function.api_handler -> aws_opensearch_domain.main -> aws_security_group.opensearch -> aws_security_group.lambda -> aws_security_group.vpc_endpoints -> aws_security_group.lambda

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_lambda_function.api_handler -> aws_security_group.lambda -> aws_security_group.vpc_endpoints -> aws_security_group.fargate -> aws_security_group.vpc_endpoints

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_apigatewayv2_api.main -> aws_cloudfront_distribution.frontend -> aws_apigatewayv2_api.main

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_apigatewayv2_api.main -> aws_cloudfront_distribution.frontend -> aws_apigatewayv2_stage.main -> aws_apigatewayv2_api.main

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_lambda_function.api_handler -> aws_opensearch_domain.main -> aws_opensearch_domain.main

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_lambda_function.api_handler -> aws_security_group.lambda -> aws_security_group.opensearch -> aws_security_group.lambda

Cyclic dependencies detected:
cycle detected:
aws_apigatewayv2_integration.lambda_integration -> aws_lambda_function.api_handler -> aws_security_group.lambda -> aws_security_group.vpc_endpoints -> aws_security_group.lambda

──────────────────────────────────
Project: infrastructure-environments-prod
Module path: infrastructure/environments/prod
Workspace: prod
Errors:
Cyclic dependencies detected:
cycle detected:
aws_security_group.vpc_endpoints -> aws_security_group.lambda -> aws_security_group.opensearch -> aws_security_group.lambda

Cyclic dependencies detected:
cycle detected:
aws_security_group.vpc_endpoints -> aws_security_group.lambda -> aws_security_group.vpc_endpoints

Cyclic dependencies detected:
cycle detected:
aws_security_group.vpc_endpoints -> aws_security_group.fargate -> aws_security_group.vpc_endpoints

──────────────────────────────────

No cloud resources were detected
