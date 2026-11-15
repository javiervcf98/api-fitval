//EJERCICIO 0//

Push directo a main

Al intentar hacer `git push` directamente a `main`, GitHub lo rechaza:

    remote: error: GH013: Repository rule violations found for refs/heads/main.
    remote: - Changes must be made through a pull request.
    remote: - 2 of 2 required status checks are expected.

La regla `proteger-main` obliga a cambiar `main` solo mediante una pull
request y con los checks `htmlhint` y `lint` en verde.

//EJERCICIO 1//
¿Qué código recibe el cliente con PostgreSQL parado?

El cliente recibe un **500** con `{ "statusCode": 500, "message": "Internal
server error" }`. En la terminal de NestJS, en cambio, sale el error completo:
`ECONNREFUSED` al conectar con `127.0.0.1:5433` (y con `::1:5433`), y la línea
exacta de mi código donde falló (`app.controller.ts:11`), además de las rutas
de las carpetas del proyecto.

Es mejor así porque esos detalles solo le sirven al programador para arreglar
el fallo; al cliente no le aportan nada y a un atacante le darían pistas
sobre cómo está montada la API.