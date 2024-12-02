class MongoDBService {
  constructor() {
    this.MONGODB_URI = 'mongodb+srv://admin:Hemzany211@fergeh.5fyte.mongodb.net/?retryWrites=true&w=majority&appName=Fergeh';
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      const { MongoClient } = await import('mongodb');
      this.client = new MongoClient(this.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db('hamzanibot');
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    await this.client.close();
    this.isConnected = false;
  }

  async savePhoto(photoData) {
    await this.connect();
    const photos = this.db.collection('photos');
    return await photos.insertOne({
      ...photoData,
      createdAt: new Date()
    });
  }

  async getPhotos(filter = {}) {
    await this.connect();
    const photos = this.db.collection('photos');
    return await photos.find(filter).toArray();
  }

  async saveCTA(ctaData) {
    await this.connect();
    const ctas = this.db.collection('ctas');
    return await ctas.insertOne({
      ...ctaData,
      createdAt: new Date()
    });
  }

  async getCTAs(filter = {}) {
    await this.connect();
    const ctas = this.db.collection('ctas');
    return await ctas.find(filter).toArray();
  }

  async saveConfig(userId, config) {
    await this.connect();
    const configs = this.db.collection('configs');
    return await configs.updateOne(
      { userId },
      { $set: { ...config, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  async getConfig(userId) {
    await this.connect();
    const configs = this.db.collection('configs');
    return await configs.findOne({ userId });
  }
}

export default new MongoDBService();