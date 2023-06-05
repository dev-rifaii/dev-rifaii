# Generating Feign clients in Java using OpenAPI code generation CLI:

The demonstration will be on a Java 17 Spring boot 3 project with Gradle Groovy DSL and
https://petstore3.swagger.io/ will be be used as an example of the API to be generated.

### Dependency:

```groovy
configurations {
    openApiGenerator
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign:4.0.1'
    implementation 'javax.annotation:javax.annotation-api:1.3.2'
    openApiGenerator 'org.openapitools:openapi-generator-cli:6.6.0'
}
```

### Open-Api code generator configuration:

```groovy
def openApiGeneratorConfig = {
    classpath configurations.openApiGenerator
    mainClass = 'org.openapitools.codegen.OpenAPIGenerator'
    args 'generate'
    args '-g', 'java'
    args '-o', "$projectDir"
    args '-t', "$projectDir/src/main/resources/openapi-config/templates"
    args "--additional-properties", "library=feign," +
            "dateLibrary=java8," +
            "useBeanValidation=false," +
            "performBeanValidation=false"
}
```
Open api generates 2 methods for each endpoint, one that wraps response objects in an ApiResponse object that contains more information about HTTP response like so:
```java
@RequestLine("POST /pet")
@Headers({
  "Content-Type: application/json",
  "Accept: application/json",
})
ApiResponse<Pet> addPetWithHttpInfo(Pet pet);
```

and one that just returns the response body like so:

```java
@RequestLine("POST /pet")
@Headers({
  "Content-Type: application/json",
  "Accept: application/json",
})
Pet addPet(Pet pet);
```

which in my use case was not needed so I ended up using a custom moustache template to generate only one method for each endpoint which only returns response body.

Add custom template [api.mustache](https://gist.github.com/dev-rifaii/2b0e7131fa60f957a2b052b48b34f0ff) to any directory in the project, path needs to be referenced in the `-t` flag in configuration accordingly.

### Task:

```groovy
task generateApi(type: JavaExec) {
    configure openApiGeneratorConfig
    systemProperties = ['apis': '', 'models': '']
    args '-i', 'https://petstore3.swagger.io/api/v3/openapi.yaml'
    args '--additional-properties', 'modelPackage=dev.rifaii.pet.model,' +
            'apiPackage="dev.rifaii.pet.api'
}
```

Running the task will generate the apis and models.

A bean for feign configuration is needed and to define the generated API base url:

```java
@Configuration
@EnableFeignClients
public class ApiConfig {

    @FeignClient(name = "petClient", url = "https://petstore3.swagger.io/api/v3")
    public interface PetApiClient extends PetApi {
    }

    @Bean
    public Contract feignContract() {
        return new Contract.Default();
    }
}
```

That wraps it up, now PetApi can just be autowired.