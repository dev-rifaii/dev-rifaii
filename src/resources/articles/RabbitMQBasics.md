# RabbitMQ

## Exchange

Before learning about RabbitMQ I thought that messages are directly sent to queues and consumers simply consume these messages.

It turns out that the flow is a bit more sophisticated. Publishers send messages to an `Exchange` which routes messages to a queue using `Bindings`.

From the [RabbitMQ documentation](https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchanges) 'Exchanges are AMQP 0-9-1 entities where messages are sent to. Exchanges take a message and route it into zero or more queues.'

## Binding

Binding is the bridge between an `Exchange` and a `Queue`.
As mentioned above, messages are sent to an exchange, in order to get the message delivered to the queue(s), you bind an exchange to one or more queues.

> When you bind a queue in your application, the binding is local to your application's channel or connection. Other applications or connections that establish their own channels will not see or be affected by the bindings created in your application.

Bindings between exchanges and queues can be different depending on the type of the exchange.

There are four types of exchanges:

- ### Direct Exchange

  This is the simplest and most commonly used type of exchage. Messages sent to a direct exchange are sent to the queue(s) based on a `Routing Key` that is chosen upon the creation of the binding.
  
  When you send a message to an exchange you send a routing key along with it, and if the routing key matches a routing key of a binding created between the exchange and the queue(s), then the message is sent to the corresponding queue(s)

  Example: If you have an exchange named `cookies` bound to a queue named `butterCookies` with the routing key `bc` then any messages sent to the exchange `cookies` with the routing key `bc` will end up in the queue `butterCookies`. No rocket science here

- ### Fanout Exchange  
  
  Messages sent to fanout exchange are sent to **all** queues bound to the exchange regardless of routing key.

- ### Topic Exchange

  Similar to direct exchange, when a message is sent to a topic exchange it is routed to any queues with that are bound to it with a matching routing key. However, topic exchange offers more flexibility by allowing the use of wildcards in the routing key.

  `* (star) can substitute for exactly one word.`

  `# (hash) can substitute for zero or more words.`
  
  Example:

  Imagine you work in a big fast food chain that has a delivery option, and this company also wants to audit specific details about every order that comes in.

  So let's say you have two queues, one named `deliveryOrders` which is consumed by some code that processes delivery orders and another named `ordersToAudit` which is consumed by some auditing department in the company.

  `orders` queue is bound to a topic exchange `ordersProcessing` with the routing key `order.delivery`, and `ordersToAudit` queue is bound to the same topic exchange with the routing key `order.#` since auditing department is interested in every order regardless of the type.

  Any messages sent to the exchange `ordersProcessing` with the routing key `order.delivery` will be routed to both queues, and any messages with routing key starting with `order.` will be routed to auditing queue without needing to explicity create a binding to auditing queue for each type of order with its own routing key.

  > routing keys for topic exchanges must be a list of words, delimited by dots.

- ### Headers  Exchange

  The RabbitMQ documentation describes Headers Exchange as "direct exchanges on steroids".

  It is possible in rabbit to send headers along with your message.
  This exchange uses headers to route messages to the bound queues instead of a routing key, which means when creating the binding you don't choose a routing key, but instead you choose one or more header(s) to have a specific value.
  Unlike routing key, the value of the header you choose does not have to be a string; it could be an integer or a hash.

  Example:
  
  When you create the binding you tell Rabbit that any message sent to this exchange needs to have the header "Foo" To have the value "Bar" and the header "John" to have the value "Doe".
  
  This begs the question, what happens if a message comes in with "Foo" having the value "Bar" but "John" doesn't have the value "Doe" ?

  This is something you can configure by telling rabbit that you want all of them to match or only one of them to match.

  Java Implementation:

  ```java
  final String QUEUE_NAME = "recipesToTry";
  final String EXCHANGE_NAME = "recipes";

  //Queue
  channel.queueDeclare(QUEUE_NAME, true, false, false, emptyMap());

  //Exchange
  channel.exchangeDeclare(EXCHANGE_NAME, "headers", true, false, emptyMap());

  //Bindings
  var bindingArgs = new HashMap<String, Object>();
  bindingArgs.put("x-match", "any"); //any
  bindingArgs.put("Vegan", "Yes");
  bindingArgs.put("Keto", "No");

  channel.queueBind(QUEUE_NAME, EXCHANGE_NAME, "", bindingArgs);
  ```

  In this case if we send a recipe to the exchange with the header "Vegan" having the value "Yes" then it will be sent to the queue regardless of the value of "Keto" because we set the value of "x-match" to **any**.
  If we wanted all of them to match then we'd set "x-match" to "all"

Useful links:

<https://www.youtube.com/watch?v=o8eU5WiO8fw>

<https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-headers>