import { PrismaClient, UserRole, PathwayType, BatchStatus, BatchStage } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed data creation...')

  // Create Users
  console.log('👥 Creating users...')
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@plant.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@plant.com',
      password: hashedPassword,
      firstName: 'Plant',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  })

  const fieldOfficer = await prisma.user.create({
    data: {
      email: 'officer@plant.com',
      password: hashedPassword,
      firstName: 'Field',
      lastName: 'Officer',
      role: UserRole.FIELD_OFFICER,
    },
  })

  // Create Species
  console.log('🌿 Creating plant species...')
  const species = await prisma.species.createMany({
    data: [
      {
        name: 'Rubber Tree',
        scientificName: 'Ficus elastica',
        targetGirth: 3.5,
        targetHeight: 50,
      },
      {
        name: 'Mango Tree',
        scientificName: 'Mangifera indica',
        targetGirth: 4.0,
        targetHeight: 60,
      },
      {
        name: 'Avocado Tree',
        scientificName: 'Persea americana',
        targetGirth: 3.0,
        targetHeight: 45,
      },
      {
        name: 'Orange Tree',
        scientificName: 'Citrus sinensis',
        targetGirth: 2.5,
        targetHeight: 40,
      },
      {
        name: 'Apple Tree',
        scientificName: 'Malus domestica',
        targetGirth: 3.2,
        targetHeight: 55,
      },
      {
        name: 'Coconut Palm',
        scientificName: 'Cocos nucifera',
        targetGirth: 5.0,
        targetHeight: 80,
      },
      {
        name: 'Teak Tree',
        scientificName: 'Tectona grandis',
        targetGirth: 4.5,
        targetHeight: 70,
      },
      {
        name: 'Mahogany Tree',
        scientificName: 'Swietenia macrophylla',
        targetGirth: 4.2,
        targetHeight: 65,
      },
    ],
  })

  // Get created species for batch creation
  const allSpecies = await prisma.species.findMany()

  // Create Zones
  console.log('🏞️ Creating zones...')
  const zone1 = await prisma.zone.create({
    data: {
      name: 'Zone A - Propagation',
      capacity: 2000,
    },
  })

  const zone2 = await prisma.zone.create({
    data: {
      name: 'Zone B - Growing',
      capacity: 3000,
    },
  })

  const zone3 = await prisma.zone.create({
    data: {
      name: 'Zone C - Hardening',
      capacity: 1500,
    },
  })

  const zone4 = await prisma.zone.create({
    data: {
      name: 'Zone D - Finishing',
      capacity: 1000,
    },
  })

  // Create Beds
  console.log('🛏️ Creating beds...')
  await prisma.bed.createMany({
    data: [
      // Zone A Beds
      { name: 'Bed A1', capacity: 400, zoneId: zone1.id },
      { name: 'Bed A2', capacity: 500, zoneId: zone1.id },
      { name: 'Bed A3', capacity: 600, zoneId: zone1.id },
      { name: 'Bed A4', capacity: 500, zoneId: zone1.id },
      
      // Zone B Beds
      { name: 'Bed B1', capacity: 750, zoneId: zone2.id },
      { name: 'Bed B2', capacity: 800, zoneId: zone2.id },
      { name: 'Bed B3', capacity: 750, zoneId: zone2.id },
      { name: 'Bed B4', capacity: 700, zoneId: zone2.id },
      
      // Zone C Beds
      { name: 'Bed C1', capacity: 375, zoneId: zone3.id },
      { name: 'Bed C2', capacity: 400, zoneId: zone3.id },
      { name: 'Bed C3', capacity: 375, zoneId: zone3.id },
      { name: 'Bed C4', capacity: 350, zoneId: zone3.id },
      
      // Zone D Beds
      { name: 'Bed D1', capacity: 250, zoneId: zone4.id },
      { name: 'Bed D2', capacity: 300, zoneId: zone4.id },
      { name: 'Bed D3', capacity: 250, zoneId: zone4.id },
      { name: 'Bed D4', capacity: 200, zoneId: zone4.id },
    ],
  })

  // Get created beds for batch assignment
  const allBeds = await prisma.bed.findMany({ include: { zone: true } })

  // Create Sample Batches
  console.log('📦 Creating sample batches...')
  const currentDate = new Date()
  
  // Helper function to generate batch numbers
  const generateBatchNumber = (pathway: PathwayType, index: number): string => {
    const year = currentDate.getFullYear().toString().slice(-2)
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const day = currentDate.getDate().toString().padStart(2, '0')
    
    const pathwayCode = {
      PURCHASING: 'PU',
      SEED_GERMINATION: 'SG',
      CUTTING_GERMINATION: 'CG',
      OUT_SOURCING: 'OS'
    }[pathway]
    
    return `${pathwayCode}${year}${month}${day}${(index + 1).toString().padStart(3, '0')}`
  }

  const batchData = [
    // Purchasing pathway batches
    {
      batchNumber: generateBatchNumber(PathwayType.PURCHASING, 0),
      customName: 'Premium Rubber Collection',
      pathway: PathwayType.PURCHASING,
      speciesId: allSpecies[0].id, // Rubber Tree
      initialQty: 500,
      currentQty: 485,
      status: BatchStatus.IN_PROGRESS,
      stage: BatchStage.GROWING,
      createdById: manager.id,
      zoneId: zone2.id,
      bedId: allBeds.find(b => b.name === 'Bed B1')?.id,
    },
    {
      batchNumber: generateBatchNumber(PathwayType.PURCHASING, 1),
      customName: 'Mango Orchard Starter',
      pathway: PathwayType.PURCHASING,
      speciesId: allSpecies[1].id, // Mango Tree
      initialQty: 300,
      currentQty: 295,
      status: BatchStatus.IN_PROGRESS,
      stage: BatchStage.HARDENING,
      createdById: manager.id,
      zoneId: zone3.id,
      bedId: allBeds.find(b => b.name === 'Bed C1')?.id,
    },
    
    // Seed germination batches
    {
      batchNumber: generateBatchNumber(PathwayType.SEED_GERMINATION, 0),
      customName: 'Avocado Seedlings',
      pathway: PathwayType.SEED_GERMINATION,
      speciesId: allSpecies[2].id, // Avocado Tree
      initialQty: 200,
      currentQty: 180,
      status: BatchStatus.IN_PROGRESS,
      stage: BatchStage.SHADE_80,
      createdById: fieldOfficer.id,
      zoneId: zone1.id,
      bedId: allBeds.find(b => b.name === 'Bed A2')?.id,
    },
    {
      batchNumber: generateBatchNumber(PathwayType.SEED_GERMINATION, 1),
      customName: 'Citrus Collection',
      pathway: PathwayType.SEED_GERMINATION,
      speciesId: allSpecies[3].id, // Orange Tree
      initialQty: 400,
      currentQty: 375,
      status: BatchStatus.IN_PROGRESS,
      stage: BatchStage.PROPAGATION,
      createdById: fieldOfficer.id,
      zoneId: zone1.id,
      bedId: allBeds.find(b => b.name === 'Bed A3')?.id,
    },
    
    // Cutting germination batches
    {
      batchNumber: generateBatchNumber(PathwayType.CUTTING_GERMINATION, 0),
      customName: 'Apple Grafts',
      pathway: PathwayType.CUTTING_GERMINATION,
      speciesId: allSpecies[4].id, // Apple Tree
      initialQty: 150,
      currentQty: 142,
      status: BatchStatus.IN_PROGRESS,
      stage: BatchStage.GROWING,
      createdById: manager.id,
      zoneId: zone2.id,
      bedId: allBeds.find(b => b.name === 'Bed B2')?.id,
    },
    
    // Out sourcing batches
    {
      batchNumber: generateBatchNumber(PathwayType.OUT_SOURCING, 0),
      customName: 'Premium Coconut Palms',
      pathway: PathwayType.OUT_SOURCING,
      speciesId: allSpecies[5].id, // Coconut Palm
      initialQty: 100,
      currentQty: 98,
      status: BatchStatus.READY,
      stage: BatchStage.PHYTOSANITARY,
      isReady: true,
      readyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ready in 7 days
      createdById: manager.id,
      zoneId: zone4.id,
      bedId: allBeds.find(b => b.name === 'Bed D1')?.id,
    },
    {
      batchNumber: generateBatchNumber(PathwayType.OUT_SOURCING, 1),
      customName: 'Teak Premium',
      pathway: PathwayType.OUT_SOURCING,
      speciesId: allSpecies[6].id, // Teak Tree
      initialQty: 75,
      currentQty: 75,
      status: BatchStatus.IN_PROGRESS,
      stage: BatchStage.RE_POTTING,
      createdById: manager.id,
      zoneId: zone3.id,
      bedId: allBeds.find(b => b.name === 'Bed C2')?.id,
    },
    {
      batchNumber: generateBatchNumber(PathwayType.PURCHASING, 2),
      customName: 'Mahogany Collection',
      pathway: PathwayType.PURCHASING,
      speciesId: allSpecies[7].id, // Mahogany Tree
      initialQty: 120,
      currentQty: 115,
      status: BatchStatus.IN_PROGRESS,
      stage: BatchStage.INITIAL,
      createdById: fieldOfficer.id,
      zoneId: zone1.id,
      bedId: allBeds.find(b => b.name === 'Bed A1')?.id,
    },
  ]

  const createdBatches = []
  for (const batch of batchData) {
    const createdBatch = await prisma.batch.create({
      data: batch,
    })
    createdBatches.push(createdBatch)
  }

  // Create Sample Measurements
  console.log('📏 Creating sample measurements...')
  const measurementData = []
  
  for (const batch of createdBatches) {
    const numberOfMeasurements = Math.floor(Math.random() * 5) + 2 // 2-6 measurements per batch
    
    for (let i = 0; i < numberOfMeasurements; i++) {
      const measurementDate = new Date(batch.createdAt)
      measurementDate.setDate(measurementDate.getDate() + (i * 7)) // Weekly measurements
      
      // Simulate growth over time
      const baseGirth = 1.0 + (i * 0.3) + (Math.random() * 0.5)
      const baseHeight = 15 + (i * 5) + (Math.random() * 8)
      
      measurementData.push({
        batchId: batch.id,
        userId: Math.random() > 0.5 ? fieldOfficer.id : manager.id,
        girth: Number(baseGirth.toFixed(2)),
        height: Number(baseHeight.toFixed(2)),
        sampleSize: Math.floor(Math.random() * 10) + 5, // 5-15 plants sampled
        notes: i === 0 ? 'Initial measurement' : `Week ${i + 1} growth check`,
        createdAt: measurementDate,
      })
    }
  }

  await prisma.measurement.createMany({
    data: measurementData,
  })

  // Create Stage History
  console.log('📋 Creating stage history...')
  const stageHistoryData = []
  
  for (const batch of createdBatches) {
    // Initial stage
    stageHistoryData.push({
      batchId: batch.id,
      fromStage: null,
      toStage: BatchStage.INITIAL,
      quantity: batch.initialQty,
      notes: 'Batch created',
      createdAt: batch.createdAt,
    })
    
    // If batch has progressed beyond initial stage
    if (batch.stage !== BatchStage.INITIAL) {
      const progressDate = new Date(batch.createdAt)
      progressDate.setDate(progressDate.getDate() + 14) // 2 weeks later
      
      stageHistoryData.push({
        batchId: batch.id,
        fromStage: BatchStage.INITIAL,
        toStage: batch.stage,
        quantity: batch.currentQty,
        notes: `Moved to ${batch.stage} stage`,
        createdAt: progressDate,
      })
    }
  }

  await prisma.stageHistory.createMany({
    data: stageHistoryData,
  })

  // Create Sample Tasks
  console.log('📋 Creating sample tasks...')
  const taskData = [
    {
      userId: fieldOfficer.id,
      type: 'MEASUREMENT',
      title: 'Weekly Measurement - Rubber Trees',
      description: 'Conduct weekly growth measurements for rubber tree batches in Zone B',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
    },
    {
      userId: fieldOfficer.id,
      type: 'STAGE_TRANSITION',
      title: 'Move Avocado Seedlings',
      description: 'Transfer avocado seedlings from shade area to growing zone',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
    },
    {
      userId: manager.id,
      type: 'INSPECTION',
      title: 'Zone C Quality Check',
      description: 'Inspect all batches in Zone C for readiness assessment',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Due tomorrow
    },
    {
      userId: fieldOfficer.id,
      type: 'MAINTENANCE',
      title: 'Bed Maintenance - Zone A',
      description: 'General maintenance and cleaning of beds in Zone A',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 1 week
    },
  ]

  await prisma.task.createMany({
    data: taskData,
  })

  // Create Sample Notifications
  console.log('🔔 Creating sample notifications...')
  const notificationData = [
    {
      userId: manager.id,
      type: 'BATCH_READY',
      title: 'Batch Ready for Delivery',
      message: 'Premium Coconut Palms (PU250811001) is ready for delivery',
    },
    {
      userId: fieldOfficer.id,
      type: 'MEASUREMENT_DUE',
      title: 'Measurement Due',
      message: 'Weekly measurements are due for 3 batches in Zone B',
    },
    {
      userId: manager.id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: 'Zone C Quality Check has been assigned to you',
    },
    {
      userId: fieldOfficer.id,
      type: 'SYSTEM_ALERT',
      title: 'Low Bed Capacity',
      message: 'Zone A beds are approaching maximum capacity',
    },
  ]

  await prisma.notification.createMany({
    data: notificationData,
  })

  // Update bed occupancy based on batches
  console.log('🔄 Updating bed occupancy...')
  for (const bed of allBeds) {
    const batchesInBed = await prisma.batch.findMany({
      where: { bedId: bed.id },
    })
    
    const totalOccupied = batchesInBed.reduce((sum, batch) => sum + batch.currentQty, 0)
    
    await prisma.bed.update({
      where: { id: bed.id },
      data: { occupied: totalOccupied },
    })
  }

  console.log('✅ Seed data creation completed!')
  console.log('\n📊 Summary:')
  console.log(`- Users: 3 (Super Admin, Manager, Field Officer)`)
  console.log(`- Species: ${allSpecies.length}`)
  console.log(`- Zones: 4`)
  console.log(`- Beds: 16`)
  console.log(`- Batches: ${createdBatches.length}`)
  console.log(`- Measurements: ${measurementData.length}`)
  console.log(`- Tasks: ${taskData.length}`)
  console.log(`- Notifications: ${notificationData.length}`)
  console.log('\n🔑 Login Credentials:')
  console.log('Super Admin: admin@plant.com / admin123')
  console.log('Manager: manager@plant.com / admin123')
  console.log('Field Officer: officer@plant.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
