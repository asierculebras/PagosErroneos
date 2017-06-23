'use strict';

var express = require('express');
var app = express();

var braintree = require('braintree');

var bodyParser = require('body-parser');
var parseUrlEnconded = bodyParser.urlencoded({
  extended: false
});

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: 'wps6ywdjkwhdcxh2',
  publicKey: '45yd4hn34wspm2vd',
  privateKey: '15cb15468dde3adac963a54d53c79001'
});

var idCustomer = "";
var token ="";


//Con esto creo un comprador, en el que se pueden guardar MUCHAS cosas.
// se podría añadr una creditCard, cvv y expirationDate, number, makeDefault para que se quede gurdada a cada usuario
// esto esta explicado aqui: https://developers.braintreepayments.com/reference/request/customer/create/node
gateway.customer.create({
  firstName: "comprador",
  lastName: "1",
  company: "Braintree",
  email: "algo@algo.es",
  phone: "312.555.1234",
  fax: "614.555.5678",
  website: "www.example.com",
  id: "123"
}, function (err, result) {
  result.success;
  // true

  //var idCustomer = result.customer.id;

  // e.g. 494019
  //console.log ("la id del cliente creado tiene que ser 123 y es: " + idCustomer)
});

//Con este metodo busco todos los compradores con las condiciones que impongo en la primera funtion
//y recojo el comprador o los compradores (dependiendo de las condidones de busqueda en la variable customer)
var stream = gateway.customer.search(function (search) {
  var customer123 = search.id().is("123");
}, function (err, response) {
  response.each(function (err, customer) {
    console.log("el nombre del customer es: "+customer.firstName);
    console.log("la ID del customer es : "+customer.id);
    idCustomer = customer.id;

  });
});


app.use(express.static('public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');







app.get('/', function (request, response) {



    response.render('index', {
    });
});






app.get('/pago', function (request, response) {

console.log("la id con la que creo el token es: "+ idCustomer);

  gateway.clientToken.generate({
    customerId: idCustomer
  }, function (err, res) {
      token = res.clientToken;

console.log ("Token " + token);

    response.render('pago', {
      clientToken: res.clientToken
    });
});

});


//atiendo a la llamada de la intendion de pagar
app.post('/process', parseUrlEnconded, function (request, response) {

//esto es el nonce que braintree genera automaticamnete al clinete y este nos lo entrega a nosotros
// braintree tiene un parametro oculto que se llama payment_method_nonce que lo requperamos de la siguinte forma.
var payment_method_nonce = request.body.payment_method_nonce;
console.log("El payment_method_nonce que briantree le ha dado a el cliente es es: "+ payment_method_nonce);


  var transaction = request.body;

console.log("transaction es: "+ transaction.payment_method_nonce);

// esto es el pago que se va a hacer, y el payment_method_nonce es el que braintree le ha dado al cliente y este nos lo ha envidado a traves del body.
  gateway.transaction.sale({
    paymentMethodNonce: transaction.payment_method_nonce
  }, function (err, result) {

    if (err) throw err;

    if (result.success) {

      console.log("Como resultado del pago esto es lo que obtenemos: " + result);

      response.sendFile('success.html', {
        root: './public'
      });
    } else {
      response.sendFile('error.html', {
        root: './public'
      });
    }
  });

});

app.listen(3000, function () {
  console.log('Listening on port 3000');
});

module.exports = app;
