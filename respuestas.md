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

Pregunta 8. ¿Por qué el correo lleva `Date.now()`?

Porque los tests de integración usan la base de datos de verdad, y el usuario
que registran se queda guardado. `Date.now()` da un número distinto en cada
ejecución, así que cada vez se registra un correo nuevo y el registro siempre
responde 201.

Con un correo fijo, la primera ejecución funcionaría, pero la segunda el
registro respondería 409 porque ese email ya existe: los tests dependerían de lo
que dejó la ejecución anterior, y no serían repetibles.

Pregunta 9. ¿Por qué no es peligroso el `${...}` del ORDER BY?

Porque lo que se pega en el SQL nunca es el texto del cliente. Primero, el DTO
solo admite tres valores en `sort` (`@IsIn`): con `?sort=id;DROP TABLE classes`
la API responde 400 y la consulta ni se ejecuta. Segundo, aunque pasara, lo que
va dentro del ORDER BY es el valor de la tabla `SORT_COLUMNS` (`c.starts_at`,
`c.activity` o `c.spots`), escrito por nosotros. Y `direction` solo puede ser
ASC o DESC porque lo decide un if.

En la Parte 2 el problema era pegar el texto del cliente tal cual. Aquí no se
puede usar `$1`, porque PostgreSQL solo acepta valores con `$`, no nombres de
columna; por eso se usa una lista blanca de opciones permitidas.

Pregunta 10. ¿Por qué el login tiene un límite más duro?

Porque el login es donde alguien intentaría adivinar una contraseña probando
miles de combinaciones seguidas (un ataque de fuerza bruta). Con 5 intentos por
minuto, probar un millón de contraseñas llevaría más de 130 días. El resto de
rutas tiene un límite más alto porque un usuario normal hace muchas peticiones
legítimas.

En Render, las peticiones llegan a la API a través de un proxy. Sin
`app.set('trust proxy', 1)`, la API vería la IP del proxy en todas las
peticiones, como si todos los usuarios fueran el mismo: entre todos gastarían
las 20 peticiones por minuto y la API respondería 429 a todo el mundo. Con
`trust proxy`, la API lee la IP real de cada usuario, que el proxy le pasa en
una cabecera.

Pregunta 11. ¿Qué ha pasado sin la transacción?

La API respondió 400 («No existe la especialidad 99»), pero Óscar se guardó
igualmente, con una sola especialidad (Fuerza). Sin BEGIN, cada INSERT se
guardaba en el momento: primero Óscar, después su especialidad 5. Al fallar la
99 no había ROLLBACK, así que nadie deshizo lo anterior. El cliente cree que no
se ha guardado nada, pero en la base de datos hay un monitor a medias. Con la
transacción, el ROLLBACK deshace todo y no queda nada.

Nuria tiene el id 6 y no el 5 porque el 5 se gastó en el intento con la
especialidad 99: el INSERT de Nuria llegó a ejecutarse y recibió el 5, y el
ROLLBACK deshizo la fila, pero no devolvió el número. Los contadores de ids de
PostgreSQL nunca vuelven atrás, para que dos transacciones a la vez no reciban
el mismo id. Por eso quedan huecos (como el 5 y el 7).

Pregunta 12. ¿Quién impide que otra-web.com lea los planes?

El navegador. La API responde 200 igualmente y solo indica, en la cabecera
`Access-Control-Allow-Origin`, qué web tiene permiso (`http://localhost:5173`).
El navegador compara esa cabecera con la dirección de la web que hizo la
petición: si coinciden, le entrega la respuesta al JavaScript de la web; si no
(como con otra-web.com), la bloquea y en la consola sale «blocked by CORS policy».

Postman y curl sí pueden leer la respuesta porque no son navegadores y no aplican
esa comprobación. CORS protege al usuario de que una web cualquiera use su
navegador para leer datos de otra API; no protege a la API de otros programas.
Para eso están los tokens y los guards.

Pregunta 13. ¿Qué dice /api/v1/health con Supabase?

Dice `"database": "postgres"` en lugar de `"fitval"`. La ruta hace
`SELECT current_database()`, que devuelve el nombre de la base de datos a la
que está conectada la API. En Docker se llamaba `fitval` (por el
`POSTGRES_DB` del `compose.yaml`), y en Supabase la base de datos de cada
proyecto se llama siempre `postgres` (es lo que va al final de la dirección).

No he tenido que cambiar nada del código: solo la variable `DATABASE_URL` del
`.env`. Como la conexión sale de una variable de entorno, el mismo código
funciona contra Docker o contra Supabase.