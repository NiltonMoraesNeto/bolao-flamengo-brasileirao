const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// Ajuste o caminho para o arquivo db.json conforme necessário
const filePath = path.join(__dirname, 'db.json');
const secretKey = 'your-secret-key'; // Use uma chave secreta segura e armazene-a em um lugar seguro

app.use(express.json());

// Configuração do middleware CORS
app.use(cors({
  origin: 'http://localhost:5173' // Permita a origem do seu frontend
}));

function readDB() {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.post('/api/usuarios/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.login.find(
    usuario => usuario.email === email && usuario.password === password
  );
  if (user) {
    const token = jwt.sign({ id: user.id, email: user.email, perfil: user.perfil, cep: user.cep, nome: user.nome, avatar: user.avatar }, secretKey, { expiresIn: '1h' });
    res.json({ token, user });
  } else {
    res.status(401).send('Email ou senha inválidos');
  }
});

app.get('/api/jogos/list', (req, res) => {
  const db = readDB();
  const jogos = db.jogos;
  res.json(jogos);
});

app.get('/api/jogosById', (req, res) => {
  const db = readDB();
  const jogoId = req.query.id; // Deixe como string
  const jogo = db.jogos.find(j => j.id === jogoId);
  if (jogo) {
    res.json(jogo);
  } else {
    res.status(404).send('Jogo não encontrado');
  }
});

app.get('/api/palpites/list', (req, res) => {
  const db = readDB();
  const palpites = db.palpites;
  res.json(palpites);
});

app.get('/api/palpitesById', (req, res) => {
  const db = readDB();
  const jogoId = parseInt(req.query.jogoId);
  const palpites = db.palpites.filter(j => j.jogoId === jogoId);
  if (palpites.length > 0) {
    res.json(palpites);
  } else {
    res.status(404).send('Nenhum palpite encontrado para o jogoId fornecido');
  }
});

app.get('/api/palpitesByIdAndUser', (req, res) => {
  const db = readDB();
  const jogoId = parseInt(req.query.jogoId);
  const usuario = req.query.usuario;

  const palpites = db.palpites.filter(p => p.jogoId === jogoId && p.usuario === usuario);
  if (palpites.length > 0) {
    res.json(palpites);
  } else {
    res.json(palpites);
    }
});

app.get('/api/usuarios/list', (req, res) => {
  const db = readDB();
  const usuarios = db.usuarios;
  res.json(usuarios);
});

app.get('/api/resultados/list', (req, res) => {
  const db = readDB();
  const resultados = db.resultados;
  res.json(resultados);
});

app.get('/api/resultadosById', (req, res) => {
  const db = readDB();
  const jogoId = req.query.id; // Deixe como string
  const jogo = db.resultados.find(j => j.id === jogoId);
  if (jogo) {
    res.json(jogo);
  } else {
    res.status(404).send('Jogo não encontrado');
  }
});


const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

app.post('/api/palpites/new', (req, res) => {
  const db = readDB();
  const newPalpite = {
    id: generateId(), // Função para gerar um novo ID único
    ...req.body,
  };

  db.palpites.push(newPalpite);
  writeDB(db);

  res.status(201).json(newPalpite);
});

app.put('/api/palpitesEdit/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = db.palpites.findIndex(p => p.id === id);

  if (index !== -1) {
    db.palpites[index] = {
      ...db.palpites[index],
      ...req.body,
    };
    writeDB(db);
    res.json(db.palpites[index]);
  } else {
    res.status(404).send('Palpite não encontrado');
  }
});

app.delete('/api/palpitesDelete/:palpiteId', (req, res) => {
  const db = readDB();
  const { palpiteId } = req.params;

  const index = db.palpites.findIndex(p => p.id === palpiteId);
  if (index !== -1) {
    db.palpites.splice(index, 1);
    writeDB(db);
    return res.status(200).send('Palpite deletado com sucesso');
  } else {
    return res.status(404).send('Palpite não encontrado');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});