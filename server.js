
const express = require('express')
const app = express()
const port = process.env.PORT || 8080

app.use(express.json())

// FIREBASE
var admin = require("firebase-admin");

var serviceAccount = require("./credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging()

function registeredToken(uid) {
    let uids = currentUsersTokens.map(t => t.uid)
    return uids.includes(uid)
}

// Almacenamiento de tokens, mientras los usuarios estén logueados
var currentUsersTokens = []

app.get('/', (req, res) => {
  res.send('Bienvenido!')
})

// Registrar un nuevo token de registro
app.post('/sendFCMToken', (req, res) => {
    try {
        var uid = req.body.uid
        var token = req.body.token
        var email = req.body.email
        if (registeredToken(uid)) {
            currentUsersTokens = currentUsersTokens.filter((t) => t.uid !== uid)
        }
        currentUsersTokens.push({uid: uid, registrationToken: token, email: email})
        console.log(currentUsersTokens)
        return res.status(200).json(currentUsersTokens)
    } catch (error) {
        console.error(error)
        return res.status(500).json(error)
    }
    
})

// Mantengo implementada esta función, pero no será utilizada por el momento
// Borrar token de registro
app.delete('/tokens/:uid', (req, res) => {
    try{
        let uid = req.params.uid
        currentUsersTokens = currentUsersTokens.filter(t => t.uid !== uid)
        return res.status(204).json()
    } catch (error) {
        console.error(error)
        return res.status(500).json(error)
    }
})

// Debug: Devolver todos los tokens de registro almacenados 
app.get('/tokens', (req, res) => {
    return res.status(200).json(currentUsersTokens)
})

// Enviar mensaje a todos los dispositivos
app.post('/send-message', (req, res) => {
    try{
        console.log(req.body)
        let msg = req.body.message
        let playersID = req.body.players
        const message = {
            data: {message: msg},
            tokens: currentUsersTokens.filter(e => playersID.includes(e.uid)).map(e => e.registrationToken)
        } 
        messaging.sendMulticast(message).then((response) => {
            console.log(response.successCount + ' messages were sent successfully');
        }).catch(error => {
            console.error(error)
        })
        return res.status(204).json()
    } catch (error) {
        console.error(error)
        return res.status(500).json(error)
    }
})

app.listen(port, () => {
  console.log(`Servidor para la gestión de notificaciones ejecutándose en el puerto ${port}`)
})