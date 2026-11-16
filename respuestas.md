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

//EJERCICIO 2//
Inyección SQL

Con la versión mala salen **las 7 clases**; con la versión buena (`$1`) no
sale **ninguna**.

En la versión mala, el texto del cliente se pega dentro del SQL y la
consulta le llega así a PostgreSQL:

    ... WHERE c.activity ILIKE '%zzz' OR 1=1 --%' ORDER BY c.starts_at

La comilla cierra el texto antes de tiempo, `OR 1=1` añade una condición que
siempre es verdadera, y `--` convierte el resto en un comentario. Por eso
salen todas las clases: el cliente ha cambiado la consulta.

Con `$1`, la consulta y el valor llegan por separado, y PostgreSQL trata el
valor siempre como un dato, nunca como SQL. Así se busca literalmente el
texto `zzz' OR 1=1 --`, que no está en ninguna actividad.