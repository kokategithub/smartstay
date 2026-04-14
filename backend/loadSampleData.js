const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const Student = require('./models/Student');
const Owner = require('./models/Owner');
const Room = require('./models/Room');

// Verified bedroom images (no underwater, no people, no sofas only)
const BED = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800',
  'https://images.unsplash.com/photo-1614649024145-7f847b1e4060?w=800',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
  'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800',
];

// Verified hall/living room images - 10 unique ones rotating across 30 rooms
const HALL = [
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800',
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
];

// Verified kitchen images - 3 unique ones rotating
const KIT = [
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
];

// Helper to get 3 images for a room by index
const imgs = (i) => [BED[i], HALL[i], KIT[i]];

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Student.deleteMany({});
  await Owner.deleteMany({});
  await Room.deleteMany({});
  console.log('Cleared existing data');

  const hashed = await bcrypt.hash('password123', 10);

  // 6 owners - one per city - all emails route to admin for demo
  // Gmail ignores the +tag part so all emails arrive at sakshikokate358@gmail.com
  const ownerBangalore = await Owner.create({ name: 'Rahul Sharma', email: 'sakshikokate358+bangalore@gmail.com', password: hashed, role: 'owner', phone: '919876543210' });
  const ownerMumbai    = await Owner.create({ name: 'Priya Patel',  email: 'sakshikokate358+mumbai@gmail.com',    password: hashed, role: 'owner', phone: '919845012345' });
  const ownerPune      = await Owner.create({ name: 'Suresh Nair',  email: 'sakshikokate358+pune@gmail.com',      password: hashed, role: 'owner', phone: '917890123456' });
  const ownerDelhi     = await Owner.create({ name: 'Amit Verma',   email: 'sakshikokate358+delhi@gmail.com',     password: hashed, role: 'owner', phone: '919012345678' });
  const ownerHyd       = await Owner.create({ name: 'Kavya Reddy',  email: 'sakshikokate358+hyderabad@gmail.com', password: hashed, role: 'owner', phone: '918765432109' });
  const ownerChennai   = await Owner.create({ name: 'Arjun Kumar',  email: 'sakshikokate358+chennai@gmail.com',   password: hashed, role: 'owner', phone: '916543210987' });
  await Student.create({ name: 'Amit Kumar', email: 'amit@user.com', password: hashed, role: 'user', phone: '919123456789' });

  // alias for backward compat
  const owner1 = ownerBangalore;
  const owner2 = ownerMumbai;
  const owner3 = ownerPune;

  const rooms = [
    // ── BANGALORE (5 rooms) ──
    {
      title: 'Cozy Studio near IT Park',
      description: 'Fully furnished studio apartment with AC, WiFi, and 24/7 security. Walking distance from major IT companies. Perfect for working professionals.',
      price: 8500, city: 'Bangalore', address: 'Koramangala, Bangalore, Karnataka',
      lat: 12.9352, lng: 77.6245, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'AC', 'Furnished', 'Security', 'Parking'],
      images: imgs(0), owner: ownerBangalore._id, available: true
    },
    {
      title: 'Luxury Studio in Indiranagar',
      description: 'High-end studio apartment with panoramic city views. Premium furnishing, smart home features, and concierge service. Close to metro.',
      price: 9999, city: 'Bangalore', address: 'Indiranagar, Bangalore, Karnataka',
      lat: 12.9784, lng: 77.6408, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'AC', 'Smart TV', 'Gym', 'Concierge', 'Parking'],
      images: imgs(1), owner: ownerBangalore._id, available: true
    },
    {
      title: 'Affordable PG near Whitefield',
      description: 'Budget-friendly PG accommodation near ITPL and Whitefield IT corridor. Includes meals, laundry, and housekeeping.',
      price: 7800, city: 'Bangalore', address: 'Whitefield, Bangalore, Karnataka',
      lat: 12.9698, lng: 77.7499, vacancy: 3, sharing: 3,
      amenities: ['WiFi', 'Meals', 'Laundry', 'Security'],
      images: imgs(2), owner: ownerBangalore._id, available: true
    },
    {
      title: 'Modern 2BHK near Electronic City',
      description: 'Spacious 2BHK flat near Infosys and Wipro campuses. Fully furnished with modular kitchen, washing machine, and covered parking.',
      price: 9200, city: 'Bangalore', address: 'Electronic City, Bangalore, Karnataka',
      lat: 12.8399, lng: 77.6770, vacancy: 2, sharing: 2,
      amenities: ['WiFi', 'AC', 'Kitchen', 'Washing Machine', 'Parking'],
      images: imgs(3), owner: ownerBangalore._id, available: true
    },
    {
      title: 'Girls PG near HSR Layout',
      description: 'Safe and comfortable PG for working women. CCTV surveillance, biometric entry, home-cooked food, and 24/7 security guard.',
      price: 8200, city: 'Bangalore', address: 'HSR Layout, Bangalore, Karnataka',
      lat: 12.9116, lng: 77.6474, vacancy: 2, sharing: 2,
      amenities: ['Meals', 'Security', 'WiFi', 'AC', 'Laundry', 'CCTV'],
      images: imgs(4), owner: ownerBangalore._id, available: true
    },

    // ── MUMBAI (5 rooms) ──
    {
      title: 'Premium PG with Meals in Andheri',
      description: 'Premium paying guest accommodation with home-cooked meals, AC rooms, and gym access. Close to Andheri metro station.',
      price: 9500, city: 'Mumbai', address: 'Andheri West, Mumbai, Maharashtra',
      lat: 19.1136, lng: 72.8697, vacancy: 3, sharing: 3,
      amenities: ['Meals', 'AC', 'Gym', 'Metro Nearby', 'WiFi'],
      images: imgs(5), owner: owner1._id, available: true
    },
    {
      title: 'Coliving Space in Bandra',
      description: 'Modern shared accommodation for young professionals in Bandra. Common living area, kitchen, and premium amenities.',
      price: 9200, city: 'Mumbai', address: 'Bandra West, Mumbai, Maharashtra',
      lat: 19.0596, lng: 72.8295, vacancy: 2, sharing: 3,
      amenities: ['WiFi', 'AC', 'Kitchen', 'Gym', 'Meals'],
      images: imgs(6), owner: owner1._id, available: true
    },
    {
      title: 'Budget Room near Powai',
      description: 'Affordable single room near IIT Bombay and Powai IT hub. Clean, well-maintained with all basic amenities included.',
      price: 7900, city: 'Mumbai', address: 'Powai, Mumbai, Maharashtra',
      lat: 19.1176, lng: 72.9060, vacancy: 2, sharing: 2,
      amenities: ['WiFi', 'Security', 'Water 24/7', 'Bus Stop Nearby'],
      images: imgs(7), owner: owner1._id, available: true
    },
    {
      title: 'Furnished Studio in Thane',
      description: 'Fully furnished studio apartment in Thane with excellent connectivity to Mumbai. Includes all utilities and high-speed internet.',
      price: 8600, city: 'Mumbai', address: 'Thane West, Mumbai, Maharashtra',
      lat: 19.2183, lng: 72.9781, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'AC', 'Furnished', 'Parking', 'Security'],
      images: imgs(8), owner: owner1._id, available: true
    },
    {
      title: 'Shared Flat near Navi Mumbai',
      description: 'Spacious shared flat in Navi Mumbai near Vashi IT park. Great connectivity via train and bus. Ideal for IT professionals.',
      price: 8000, city: 'Mumbai', address: 'Vashi, Navi Mumbai, Maharashtra',
      lat: 19.0771, lng: 73.0002, vacancy: 2, sharing: 3,
      amenities: ['WiFi', 'Kitchen', 'Washing Machine', 'Security'],
      images: imgs(9), owner: owner1._id, available: true
    },

    // ── PUNE (5 rooms) ──
    {
      title: 'Spacious 2BHK for Students',
      description: 'Large 2BHK apartment near top engineering colleges. Includes kitchen, washing machine, and study area. Ideal for students.',
      price: 7500, city: 'Pune', address: 'Kothrud, Pune, Maharashtra',
      lat: 18.5074, lng: 73.8077, vacancy: 2, sharing: 2,
      amenities: ['WiFi', 'Kitchen', 'Washing Machine', 'Study Table'],
      images: imgs(10), owner: owner1._id, available: true
    },
    {
      title: 'Homely PG for Girls in Viman Nagar',
      description: 'Safe and comfortable PG for working women and female students. CCTV surveillance, biometric entry, and home food.',
      price: 8200, city: 'Pune', address: 'Viman Nagar, Pune, Maharashtra',
      lat: 18.5679, lng: 73.9143, vacancy: 2, sharing: 2,
      amenities: ['Meals', 'Security', 'WiFi', 'AC', 'Laundry'],
      images: imgs(11), owner: owner1._id, available: true
    },
    {
      title: 'Modern Flat near Hinjewadi IT Park',
      description: 'Well-furnished flat near Hinjewadi Phase 1 and 2. Perfect for IT professionals working in Infosys, Wipro, TCS campuses.',
      price: 9000, city: 'Pune', address: 'Hinjewadi, Pune, Maharashtra',
      lat: 18.5912, lng: 73.7380, vacancy: 1, sharing: 2,
      amenities: ['WiFi', 'AC', 'Furnished', 'Parking', 'Gym'],
      images: imgs(12), owner: owner1._id, available: true
    },
    {
      title: 'Budget PG near Pune University',
      description: 'Affordable PG accommodation near Savitribai Phule Pune University. Includes meals, WiFi, and study room.',
      price: 7600, city: 'Pune', address: 'Shivajinagar, Pune, Maharashtra',
      lat: 18.5308, lng: 73.8474, vacancy: 3, sharing: 3,
      amenities: ['WiFi', 'Meals', 'Study Room', 'Security'],
      images: imgs(13), owner: owner1._id, available: true
    },
    {
      title: 'Premium Studio in Baner',
      description: 'Luxurious studio apartment in Baner with rooftop access, gym, and swimming pool. Close to Balewadi sports complex.',
      price: 9800, city: 'Pune', address: 'Baner, Pune, Maharashtra',
      lat: 18.5590, lng: 73.7868, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'AC', 'Pool', 'Gym', 'Rooftop', 'Parking'],
      images: imgs(14), owner: owner1._id, available: true
    },

    // ── DELHI (5 rooms) ──
    {
      title: 'Budget Room near Delhi University',
      description: 'Affordable single room near Delhi University North Campus. Clean, safe, and well-connected by metro and bus.',
      price: 7800, city: 'Delhi', address: 'North Campus, Delhi',
      lat: 28.6862, lng: 77.2217, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'Security', 'Water 24/7', 'Metro Nearby'],
      images: imgs(15), owner: owner1._id, available: true
    },
    {
      title: 'Compact Room near Laxmi Nagar Metro',
      description: 'Well-maintained compact room just 5 minutes from Laxmi Nagar metro station. Great connectivity to all major areas of Delhi.',
      price: 8000, city: 'Delhi', address: 'Laxmi Nagar, Delhi',
      lat: 28.6315, lng: 77.2767, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'Metro Nearby', 'Security'],
      images: imgs(16), owner: owner1._id, available: true
    },
    {
      title: 'Shared PG near Connaught Place',
      description: 'Centrally located PG near Connaught Place. Walking distance from Rajiv Chowk metro. Ideal for working professionals.',
      price: 9500, city: 'Delhi', address: 'Connaught Place, New Delhi',
      lat: 28.6315, lng: 77.2167, vacancy: 2, sharing: 2,
      amenities: ['WiFi', 'AC', 'Metro Nearby', 'Security', 'Meals'],
      images: imgs(17), owner: owner1._id, available: true
    },
    {
      title: 'Furnished Room in Dwarka',
      description: 'Fully furnished room in Dwarka Sector 12. Close to Dwarka metro and IGI Airport. Ideal for aviation and corporate professionals.',
      price: 8800, city: 'Delhi', address: 'Dwarka Sector 12, New Delhi',
      lat: 28.5921, lng: 77.0460, vacancy: 2, sharing: 2,
      amenities: ['WiFi', 'AC', 'Furnished', 'Parking', 'Metro Nearby'],
      images: imgs(18), owner: owner1._id, available: true
    },
    {
      title: 'Student PG near Hauz Khas',
      description: 'Vibrant PG near Hauz Khas village and IIT Delhi. Popular among students and young professionals. Rooftop terrace included.',
      price: 9000, city: 'Delhi', address: 'Hauz Khas, New Delhi',
      lat: 28.5494, lng: 77.2001, vacancy: 3, sharing: 3,
      amenities: ['WiFi', 'Rooftop', 'Security', 'Metro Nearby', 'Meals'],
      images: imgs(19), owner: owner1._id, available: true
    },

    // ── HYDERABAD (5 rooms) ──
    {
      title: 'Modern Flat near HITEC City',
      description: 'Beautifully designed modern flat in the heart of Hyderabad tech corridor. Fully furnished with premium amenities.',
      price: 9800, city: 'Hyderabad', address: 'HITEC City, Hyderabad, Telangana',
      lat: 17.4435, lng: 78.3772, vacancy: 2, sharing: 2,
      amenities: ['WiFi', 'AC', 'Furnished', 'Gym', 'Pool'],
      images: imgs(20), owner: owner1._id, available: true
    },
    {
      title: 'Budget PG near Gachibowli',
      description: 'Affordable PG near Microsoft, Google, and Amazon campuses in Gachibowli. Includes meals and laundry service.',
      price: 7700, city: 'Hyderabad', address: 'Gachibowli, Hyderabad, Telangana',
      lat: 17.4401, lng: 78.3489, vacancy: 3, sharing: 3,
      amenities: ['WiFi', 'Meals', 'Laundry', 'Security'],
      images: imgs(21), owner: owner1._id, available: true
    },
    {
      title: 'Furnished Studio in Madhapur',
      description: 'Stylish studio apartment in Madhapur IT hub. Walking distance from major tech companies. Premium interiors and amenities.',
      price: 9200, city: 'Hyderabad', address: 'Madhapur, Hyderabad, Telangana',
      lat: 17.4486, lng: 78.3908, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'AC', 'Furnished', 'Security', 'Gym'],
      images: imgs(22), owner: owner1._id, available: true
    },
    {
      title: 'Shared Room near Kondapur',
      description: 'Comfortable shared accommodation near Kondapur and Financial District. Good connectivity via MMTS and buses.',
      price: 8100, city: 'Hyderabad', address: 'Kondapur, Hyderabad, Telangana',
      lat: 17.4600, lng: 78.3615, vacancy: 2, sharing: 2,
      amenities: ['WiFi', 'Kitchen', 'Security', 'Bus Stop Nearby'],
      images: imgs(23), owner: owner1._id, available: true
    },
    {
      title: 'Coliving near Financial District',
      description: 'Shared accommodation near Hyderabad Financial District. Common kitchen, study area, and regular social events.',
      price: 8900, city: 'Hyderabad', address: 'Financial District, Hyderabad, Telangana',
      lat: 17.4156, lng: 78.3487, vacancy: 2, sharing: 3,
      amenities: ['WiFi', 'AC', 'Kitchen', 'Security', 'Events'],
      images: imgs(24), owner: owner1._id, available: true
    },

    // ── CHENNAI (5 rooms) ──
    {
      title: 'Shared Room near Anna University',
      description: 'Affordable shared accommodation for students near Anna University. Includes all utilities and internet.',
      price: 7600, city: 'Chennai', address: 'Guindy, Chennai, Tamil Nadu',
      lat: 13.0067, lng: 80.2206, vacancy: 2, sharing: 3,
      amenities: ['WiFi', 'Kitchen', 'Security', 'Bus Stop Nearby'],
      images: imgs(25), owner: owner1._id, available: true
    },
    {
      title: 'Modern PG near OMR IT Corridor',
      description: 'Well-furnished PG near Old Mahabalipuram Road IT corridor. Close to TCS, Cognizant, and Infosys campuses.',
      price: 8400, city: 'Chennai', address: 'OMR, Chennai, Tamil Nadu',
      lat: 12.9010, lng: 80.2279, vacancy: 3, sharing: 2,
      amenities: ['WiFi', 'AC', 'Meals', 'Security', 'Parking'],
      images: imgs(26), owner: owner1._id, available: true
    },
    {
      title: 'Budget Room near Tambaram',
      description: 'Affordable single room near Tambaram railway station. Excellent connectivity to all parts of Chennai via train.',
      price: 7500, city: 'Chennai', address: 'Tambaram, Chennai, Tamil Nadu',
      lat: 12.9249, lng: 80.1000, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'Security', 'Train Station Nearby'],
      images: imgs(27), owner: owner1._id, available: true
    },
    {
      title: 'Premium Flat near Adyar',
      description: 'Luxurious flat in upscale Adyar locality. Close to IIT Madras and Adyar beach. Premium furnishing and amenities.',
      price: 9700, city: 'Chennai', address: 'Adyar, Chennai, Tamil Nadu',
      lat: 13.0012, lng: 80.2565, vacancy: 1, sharing: 1,
      amenities: ['WiFi', 'AC', 'Furnished', 'Gym', 'Parking', 'Security'],
      images: imgs(28), owner: owner1._id, available: true
    },
    {
      title: 'Coliving near Sholinganallur',
      description: 'Shared accommodation near Sholinganallur IT park. Common kitchen, study room, and all-inclusive pricing.',
      price: 8800, city: 'Chennai', address: 'Sholinganallur, Chennai, Tamil Nadu',
      lat: 12.9010, lng: 80.2280, vacancy: 3, sharing: 3,
      amenities: ['WiFi', 'AC', 'Kitchen', 'Meals', 'Gym'],
      images: imgs(29), owner: owner1._id, available: true
    },
  ];

  await Room.insertMany(rooms.map(r => ({ ...r, ownerModel: 'Owner' })));
  console.log(`✅ Inserted ${rooms.length} rooms across 6 cities (5 per city)`);
  console.log('─────────────────────────────────');
  console.log('Login credentials:');
  console.log('Owner: sakshikokate358@gmail.com / password123');
  console.log('User:  amit@user.com / password123');
  console.log('─────────────────────────────────');
  mongoose.disconnect();
};

seedData().catch(console.error);




