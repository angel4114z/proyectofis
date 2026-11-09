# Tinder UD

MVP académico para facilitar conexiones entre estudiantes mediante perfiles,
reacciones y matches. El backend usa FastAPI; los datos son temporales y viven
en memoria. No hay integración con PostgreSQL, validación de pertenencia
universitaria, fotos ni registro de cuentas en esta etapa.

## Backend

Desde `backend/`, crea y activa un entorno virtual e instala las dependencias:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

La documentación interactiva queda disponible en `http://127.0.0.1:8000/docs`.
Los cambios y sesiones de prueba se pierden al reiniciar el servidor.

En otra terminal, sirve el frontend estático desde `frontend/`:

```bash
cd frontend
python3 -m http.server 5500
```

Abre `http://127.0.0.1:5500`. El backend permite solicitudes CORS desde esos
dos orígenes locales de desarrollo. `FRONTEND_ORIGINS` en `backend/.env` puede
contener una lista de orígenes separados por comas para otro entorno.

### Cuentas de demostración

Las tres cuentas (`ana@demo.test`, `luis@demo.test` y `maria@demo.test`) usan
la contraseña `Demo123!`. Son datos ficticios únicamente para probar el MVP.
El token Bearer devuelto por `POST /auth/login` identifica al estudiante.

### Rutas del MVP

- `POST /auth/login`: valida credenciales y crea una sesión temporal.
- `GET /profiles/me`, `PUT /profiles/me`: consulta y edita el perfil propio.
- `GET /profiles`: explora perfiles no reaccionados; acepta `faculty`, `campus`
  e `interest` como filtros opcionales.
- `GET /profiles/search`: búsqueda manual; puede incluir perfiles a los que ya
  se reaccionó.
- `POST /reactions`: registra un `like` o `dislike` inmutable. Un segundo
  intento para el mismo par de estudiantes devuelve `409`.
- `GET /matches`: consulta las conexiones creadas por likes mutuos.

Todas las rutas salvo el login requieren `Authorization: Bearer <token>`.
Las reacciones no se pueden reemplazar y no tienen aún una regla de repetición
por tiempo; si se define un periodo de espera posteriormente, deberá acordarse
antes de implementarlo.

## Integración futura con PostgreSQL

`backend/core/contratos.py` define los contratos que cumple el adaptador temporal
`InMemoryStore`. El adaptador PostgreSQL deberá implementar:

- búsqueda de cuenta por correo y creación/consulta de sesiones;
- consulta y actualización del perfil propio;
- listado de perfiles con filtros y exclusión del estudiante actual;
- consulta de perfiles ya reaccionados para distinguir exploración de búsqueda;
- registro único de reacción por emisor/receptor y consulta de reacciones
  recíprocas;
- creación de una única conexión ante likes mutuos, dentro de una transacción;
- listado de conexiones de un estudiante.

La operación de registrar una reacción y crear la conexión debe ser atómica en
PostgreSQL y tener una restricción que impida duplicar una reacción o conexión.
Los servicios de `core/` dependen de esos contratos, no de FastAPI ni del motor
de base de datos.

## Pruebas del backend

```bash
cd backend
python3 -m unittest discover -s tests -v
```