# Reverse proxy using Nginx

Most of the work will be done inside nginx.conf which is inside conf directory where nginx is installed. If you are running nginx in docker then you can write a config file and mount it to the contianer.

> **Remember to reload nginx everytime you make configuration changes by running `nginx -s reload`**

## Routing

Assuming you installed Nginx and have two instances of this application running on ports 3000 and 3001

```javascript
var http = require('http');
let port = 3000;

http.createServer((req, res) => {
    //Change to 'Response from app2' in second instance
    res.write('Response from app1'); 
    res.end();
}).listen(port, () => {
    console.log(`Started at port ${port}`);
});
```

nginx.conf would look like this:

```nginx
events {}

http {
    server {
        listen       80;
        server_name  localhost;

        location /app1 {
            proxy_pass             http://localhost:3000;
        }

        location /app2 {
            proxy_pass             http://localhost:3001;
        }
    }
}
```

* value of [`listen`](http://nginx.org/en/docs/http/ngx_http_core_module.html#listen) is the port nginx will be running on.

* value of [`server_name`](http://nginx.org/en/docs/http/server_names.html) sets names of a virtual server (I also have no clue what this means)

* value of [`location`](http://nginx.org/en/docs/http/ngx_http_core_module.html#location) defines the path where the request will be listened to

* value of [`proxy_pass`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass) is where requests to `location` will be routed to

>Mentioned directives can have optional parameters for additional configuiration, check nginx documentation

In this case:

curl <http://localhost:80/app1>, should return "*Response from app1*",

curl <http://localhost:80/app2> should return "*Response from app1*"

## Headers

Headers can be appended for each proxied request, nginx offers predefined variables that contain info about original request. A good use case would be to add more info about the main requester.

Syntax is:

```nginx
proxy_set_header name value
```

nginx.conf:

```nginx
events {}

http {
    server {
        listen       80;
        server_name  localhost;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Any-Header-Name goofy;
        
        location /app1 {
            proxy_pass             http://localhost:3000;
        }
        
        location /app2 {
            proxy_pass             http://localhost:3001;
        }
    }
}
```

> More predefined header variables can be found in the [nginx documentation](http://nginx.org/en/docs/http/ngx_http_core_module.html#variables).

Now these headers will be appended to requests sent to both applications since they are set in `server` block and not inside a specific `location` block.

In order to append a header for requests sent to a specific app then set the header inside the location block.

> Custom headers sent from client are automatically appended to the proxied request.

## Logging

By default nginx writes logs in `logs/access.log` for each processed request.

To setup custom logging format:

* `log_format` name is self explanatory, sets logging format  
syntax:

    ```nginx
    log_format name [escape=default|json|none] string ...;
    ```

    example:

    ```nginx
    log_format custom_log '"Request: $request\n Status: $status\n Request_URI: $request_uri\n Host: $host\n Client_IP: $remote_addr\n Proxy_IP(s): $proxy_add_x_forwarded_for\n Proxy_Hostname: $proxy_host\n Real_IP: $http_x_real_ip\n User_Client: $http_user_agent"';
    ```

* `access_log` is used to set file to write logs in, log format, and configuration for buffered logging if desired.  
syntax:

    ```nginx
    access_log path [format [buffer=size] [gzip[=level]] [flush=time] [if=condition]];
    ```

    example:

    ```nginx
    #            path                       custom log format name
    access_log   logs/custom_access_log.log             custom_log;
    ```

    > in this case only path and logging format are specified.

    Obviously you need to create custom_access_log.log file inside nginx/logs dir.

    By default logs are written in logs/access.log file which already exists when you install nginx. If you want the logs to be written in access.log still instead of a new file then use logs/access.log as path instead.

nginx.conf:

```nginx
events {}

http {

    log_format custom_log '"Request: $request\n Status: $status\n Request_URI: $request_uri\n Host: $host\n Client_IP: $remote_addr\n Proxy_IP(s): $proxy_add_x_forwarded_for\n Proxy_Hostname: $proxy_host\n Real_IP: $http_x_real_ip\n User_Client: $http_user_agent"';

    server {
        listen       80;
        server_name  localhost;
        access_log   logs/custom_access_log.log custom_log;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Goofy-Header goofy;

        location /app1 {
            proxy_pass             http://localhost:3000;
        }

        location /app2 {
            proxy_pass             http://localhost:3001;
        }
    }

}
```

Try sending a request then check log file, you should have a log that looks like this:

```text
"Request: GET /app1/ HTTP/1.1
 Status: 200
 Request_URI: /app1/
 Host: localhost
 Client_IP: 127.0.0.1
 Proxy_IP(s): 127.0.0.1
 Proxy_Hostname: localhost:3000
 Real_IP: -
 User_Client: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
```

[Nginx logging documentation](http://nginx.org/en/docs/http/ngx_http_log_module.html#access_log), more info can be found here along with common variables for setting up custom logging.

### Useful links

-[Directives List](http://nginx.org/en/docs/dirindex.html)

-[Common configuration mistakes](https://www.nginx.com/blog/avoiding-top-10-nginx-configuration-mistakes/?utm_medium=owned-social&utm_source=youtube&utm_campaign=ww-nx_ssap_g&utm_content=bg-)
