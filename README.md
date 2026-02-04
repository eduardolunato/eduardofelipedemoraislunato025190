![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tests](https://img.shields.io/badge/tests-33%20passed-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)


# 🐶 Meu Pet – Frontend

Projeto desenvolvido para o processo seletivo de 
**Engenheiro da Computação - Sênior – Estado de Mato Grosso**.

Aplicação SPA em **React + TypeScript + Vite + Tailwind**, consumindo a API pública de registro de Pets e Tutores.

Swagger dos endpoints: https://pet-manager-api.geia.vip/q/swagger-ui/

---

# 👤 Dados da inscrição

- Candidato: Eduardo Felipe de Morais Lunato  
- Vaga: Engenheiro da Computação - Sênior  
- Projeto: MeuPet  
- Repositório: https://github.com/eduardolunato/eduardofelipedemoraislunato025190

---

# 🚀 Tecnologias utilizadas

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router DOM (Lazy Loading)
- Axios
- Vitest + Testing Library
- Docker + Nginx

---

# 🏗️ Arquitetura do projeto

### Estrutura de pastas

```
src
├─ api/            # serviços HTTP (axios)
├─ components/     # componentes reutilizáveis
├─ hooks/          # hooks customizados
├─ modules/
│   ├─ pets/
│   └─ tutores/
├─ pages/
├─ routes/
├─ utils/
├─ test/
```


### Padrões adotados

- Separação por domínio (Pets / Tutores)
- Services para chamadas HTTP
- Componentização
- Lazy loading de rotas
- Tipagem forte com DTOs
- Testes unitários
- Build multi-stage Docker

---

# 📦 Funcionalidades implementadas

## Pets
- Listagem com paginação
- Busca por nome
- Detalhamento
- Cadastro
- Edição
- Upload de foto
- Vincular / desvincular tutor
- Exclusão

## Tutores
- Listagem
- Detalhamento
- Cadastro
- Edição
- Upload de foto
- Vincular / desvincular pets
- Exclusão

## Autenticação
- Login
- Refresh token
- Interceptor Axios

---

# 🧪 Testes unitários

Executar:

```bash
npm run test
```

Testes criados para:
- utils (jwt, mask)
- Login
- PetsList
- PetDetail
- PetCreate
- PetEdit
- TutoresList
- TutorDetail
- TutorCreate
- TutorEdit

Coverage

```bash
npm run test:coverage
```
Relatório HTML:
```
Abra o arquivo → coverage/index.html
```


# 🖥️ Rodando localmente (dev)

```bash
npm install
npm run dev
```
Abrir: http://localhost:5173


# 🐳 Rodando com Docker (produção)

Build
```bash
docker build -t pet-manager .
```
Run
```bash
docker run -p 8080:80 pet-manager
```
Abrir: http://localhost:8080

# 📄 Scripts disponíveis

| Script                | Função         |
| --------------------- | -------------- |
| npm run dev           | ambiente dev   |
| npm run build         | build produção |
| npm run preview       | preview build  |
| npm run test          | testes         |
| npm run test:coverage | coverage       |

# 🔍 Como avaliar rapidamente o projeto

1. Rodar testes → npm run test
2. Rodar coverage → npm run test:coverage
3. Subir container → docker build + docker run
4. Testar CRUD completo de Pets e Tutores

# 📦 Deploy

Projeto preparado para deploy em:

- Docker + Nginx
- Linux server
- VPS / Kubernetes
- Vercel / Netlify (build estático)

```nginx
build → gerar dist → servir com nginx
```

# ✅ Requisitos atendidos

- ✔ Requisições em tempo real
- ✔ Layout responsivo
- ✔ Tailwind
- ✔ Lazy Loading
- ✔ Paginação
- ✔ TypeScript
- ✔ Organização por módulos
- ✔ Testes unitários
- ✔ Docker
- ✔ README completo


# ❗Priorização

1. Funcionalidades principais (CRUD completo)
2. Organização do código
3. Tipagem forte
4. Testes unitários
5. Dockerização

# 🎯 Conclusão

Aplicação completa, escalável e pronta para produção, com testes automatizados, container Docker e arquitetura modular.

Projeto desenvolvido com foco em:

- Clean Code
- Legibilidade
- Manutenibilidade
- Escalabilidade