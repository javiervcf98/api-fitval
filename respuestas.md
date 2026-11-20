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

//EJERCICIO 3//
¿Para qué comprobamos en la API que el monitor existe?

PostgreSQL ya impediría guardar una clase con un monitor que no existe, gracias
a la clave ajena. Pero lo haría lanzando un error de clave ajena, que NestJS no
conoce, y el cliente recibiría un 500 «Internal server error», como si fuera un
fallo nuestro y sin saber qué ha hecho mal. Comprobándolo antes, la API responde
un 400 con un mensaje claro: «No existe ningún monitor con ese trainerId». La
clave ajena sigue siendo útil como última protección de los datos.

//PREGUNTA 4//
¿Por qué borrar una clase con reservas es 409 y no 400?

Porque la petición está bien hecha: el id es correcto y la clase existe. El
problema no es lo que envía el cliente, sino el estado actual de la clase, que
tiene reservas. Si no las tuviera, la misma petición funcionaría. El 400 es
para peticiones mal hechas que el cliente debe corregir; el 409, para peticiones
correctas que chocan con lo que hay en la base de datos.

//PREGUNTA 5//
¿Qué lleva dentro el token? ¿Por qué no metemos el rol?
En jwt.io se ve que el token de Ana lleva `sub: 1` (su id), `iat` (cuándo se
creó) y `exp` (cuándo caduca, una hora después). Se puede leer sin conocer el
secreto: el token no está cifrado, solo firmado. Nadie puede cambiarlo sin que
la firma deje de coincidir, pero cualquiera puede ver lo que lleva.

No metemos el rol porque puede cambiar. Si fuera dentro del token, se quedaría
con el valor del momento del login hasta que caducara. Así, en cambio, el guard
lee el usuario de la base de datos en cada petición y el rol siempre está al día.

Pregunta 6. ¿Por qué funciona el token de recepción sin volver a hacer login?

Porque el token solo lleva el id (`sub: 2`), no el rol. En cada petición, el
`AuthGuard` busca el usuario en la base de datos con ese id, así que lee su rol
actual. Al hacer el UPDATE a `staff`, la siguiente petición ya lo vio como
personal del gimnasio, con el mismo token.

Si el rol fuera dentro del token, la API se fiaría de lo que dice el token:
recepción seguiría siendo `member` hasta que caducara el token o volviera a
hacer login. Y al revés sería peor: si a alguien le quitáramos el rol `staff`,
podría seguir creando y borrando clases con su token antiguo hasta que caducara.

Pregunta 7. ¿Por qué el test no necesita PostgreSQL?

Porque `ClassesService` no se conecta a la base de datos él mismo: recibe un
`Pool` y solo llama a su método `query`. En el test le damos un Pool falso,
que responde lo que nosotros le decimos (`{ rows: [] }`), así que el servicio
cree que la base de datos no ha encontrado el monitor. Por eso el test se puede
ejecutar en cualquier sitio, como en el CI de GitHub, donde no hay PostgreSQL.

Lo que no puede comprobar es que el SQL esté bien escrito ni que funcione de
verdad: si la consulta tuviera un error de sintaxis, un nombre de columna mal o
un JOIN equivocado, el Pool falso respondería igualmente lo que le hemos dicho y
el test pasaría. Eso solo se descubre con la base de datos real, en los tests de
integración.