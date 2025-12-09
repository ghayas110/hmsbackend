const { User } = require('./src/models');

async function listUsers() {
    try {
        const users = await User.findAll({ attributes: ['id', 'username', 'email', 'role'] });
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error(error);
    }
}

listUsers();
