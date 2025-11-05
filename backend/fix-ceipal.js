const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ats_resume_optimizer')
  .then(async () => {
    const result = await mongoose.connection.db.collection('ceipalconfigs').updateOne(
      { userId: 'default-user' },
      {
        $set: {
          customEndpoint: 'https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/b6d6b4f843d706549fa2b50f2dc9612a/',
          tenantId: 'Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09',
          companyId: 'b6d6b4f843d706549fa2b50f2dc9612a',
          apiUrl: 'https://api.ceipal.com',
          apiKey: '312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd',
          mockMode: false
        }
      }
    );
    console.log('✅ Ceipal config updated!', result);
    await mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
