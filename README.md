# Rabe PrimeAuto

Sistema web para gestão operacional de serviços automotivos, com controle de entrada de veículos, ordens de serviço, clientes, estoque, custos, faturamento e relatórios.

## Funcionalidades

- Login, cadastro e recuperação de senha
- Dashboard operacional
- Entrada de veículos no pátio
- Cadastro e histórico de clientes
- Ordens de serviço
- Controle de status da OS
- Registro de avarias e fotos
- Serviços e categorias configuráveis
- Controle de estoque e movimentações
- Custos por serviço
- Formas de pagamento
- Faturamento e lucro
- Relatórios com gráficos
- Exportação CSV
- Impressão de ordem de serviço

## Tecnologias

- React 18
- Vite
- React Router
- Tailwind CSS
- Radix UI
- Framer Motion
- Lucide React
- Recharts
- TanStack Query
- Moment.js

## Requisitos

- Node.js 18 ou superior
- npm
- Backend REST compatível com o contrato descrito neste README

## Instalação

```bash
git clone https://github.com/wuotans/rabe-primeauto.git
cd rabe-primeauto
npm install
```

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000/api
```

Se `VITE_API_URL` não for definido, o frontend utiliza `/api`.

## Executando localmente

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Visualização do build:

```bash
npm run preview
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run typecheck
```

## Estrutura principal

```text
src/
├── api/
│   └── apiClient.js
├── components/
├── lib/
├── pages/
├── App.jsx
└── main.jsx
```

A comunicação com o backend deve permanecer centralizada em `src/api/apiClient.js`.

## Autenticação

Endpoints esperados:

```text
POST /auth/login
GET  /auth/me
POST /auth/register
POST /auth/verify-otp
POST /auth/resend-otp
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/oauth/google
```

O login e a validação OTP podem retornar:

```json
{
  "access_token": "token"
}
```

O token é salvo no `localStorage` com a chave:

```text
primeauto_access_token
```

E enviado nas chamadas autenticadas:

```text
Authorization: Bearer <token>
```

## Upload de arquivos

As fotos de avarias utilizam:

```text
POST /uploads
Content-Type: multipart/form-data
```

Campo esperado:

```text
file
```

Resposta esperada:

```json
{
  "file_url": "https://exemplo.com/uploads/foto.jpg"
}
```

## Recursos da API

O frontend trabalha com os seguintes recursos:

```text
/entities/clients
/entities/damage-types
/entities/service-categories
/entities/service-orders
/entities/service-types
/entities/stock-items
/entities/stock-movements
```

Cada recurso deve implementar:

```text
GET    /entities/<recurso>
GET    /entities/<recurso>/:id
POST   /entities/<recurso>
PUT    /entities/<recurso>/:id
DELETE /entities/<recurso>/:id
```

Listagens aceitam os parâmetros:

```text
?sort=-created_date&limit=100
```

Filtros adicionais podem ser enviados por query string.

## Entidades do sistema

### Client

Principais campos:

```text
id
name
phone
has_contract
created_date
```

### ServiceOrder

Principais campos:

```text
id
os_number
client_id
client_name
client_phone
has_contract
vehicle
plate
services
service_category
service_costs
total_cost
damages
damage_photos
observations
status
value
payment_method
checkin_date
checkout_date
created_date
```

Status utilizados pelo frontend:

```text
Aguardando
Em Andamento
Concluído
Liberado
```

### ServiceType

```text
id
name
category
active
```

### ServiceCategory

```text
id
name
active
```

### DamageType

```text
id
name
icon
active
```

### StockItem

```text
id
name
category
unit
current_quantity
min_quantity
unit_cost
created_date
```

### StockMovement

```text
id
stock_item_id
stock_item_name
type
quantity
unit_cost
total_value
reason
created_date
```

Tipos de movimentação utilizados:

```text
Entrada
Saída
```

## Módulos

### Dashboard

Mostra veículos no pátio, serviços concluídos no dia e faturamento diário.

### Entrada de veículo

Permite selecionar ou cadastrar cliente, veículo, serviços, custos, avarias, fotos e observações antes de gerar a ordem de serviço.

### Ordens de serviço

Permite acompanhar o fluxo operacional desde a entrada até a liberação do veículo.

### Clientes

Mantém cadastro e histórico de serviços por cliente.

### Estoque

Controla produtos, insumos, quantidade mínima, custo unitário, entradas e saídas.

### Relatórios

Exibe faturamento, custos, lucro, gastos de estoque, ticket médio, categorias e formas de pagamento, além de exportar dados em CSV.

### Ajustes

Permite administrar serviços, categorias e tipos de avaria utilizados no sistema.

## Backend

Este repositório contém o frontend. Para operação completa é necessário implementar uma API compatível com os endpoints descritos acima e persistir os dados em um banco de dados próprio.

A arquitetura do frontend não depende de SDK proprietário: integrações futuras devem continuar passando por `src/api/apiClient.js`.
