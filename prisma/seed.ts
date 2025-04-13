import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
    },
  });

  // Create a sound library
  const library = await prisma.soundLibrary.create({
    data: {
      name: 'Sample Library',
      userId: user.id,
    },
  });

  // Create some tags first
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'drums' } }),
    prisma.tag.create({ data: { name: 'bass' } }),
    prisma.tag.create({ data: { name: 'synth' } }),
    prisma.tag.create({ data: { name: 'loop' } }),
    prisma.tag.create({ data: { name: 'fx' } }),
    prisma.tag.create({ data: { name: 'vocal' } }),
  ]);

  // Create sample sounds
  const sampleSounds = [
    {
      name: 'Deep House Bass Loop',
      description: 'Punchy bass loop perfect for house music',
      audioUrl: 'https://example.com/samples/bass-loop-1.wav',
      bpm: 124,
      key: 'C minor',
      tags: [tags[1], tags[3]], // bass, loop
    },
    {
      name: 'Drum Break',
      description: 'Classic breakbeat sample',
      audioUrl: 'https://example.com/samples/drum-break-1.wav',
      bpm: 128,
      key: null,
      tags: [tags[0], tags[3]], // drums, loop
    },
    {
      name: 'Analog Synth Lead',
      description: 'Warm analog synth melody',
      audioUrl: 'https://example.com/samples/synth-lead-1.wav',
      bpm: 120,
      key: 'F major',
      tags: [tags[2]], // synth
    },
    {
      name: 'Vocal Chop',
      description: 'Processed vocal sample for EDM',
      audioUrl: 'https://example.com/samples/vocal-chop-1.wav',
      bpm: 128,
      key: 'A minor',
      tags: [tags[5], tags[4]], // vocal, fx
    },
  ];

  // Add all sounds to the database
  for (const soundData of sampleSounds) {
    await prisma.sound.create({
      data: {
        name: soundData.name,
        description: soundData.description,
        audioUrl: soundData.audioUrl,
        libraryId: library.id,
        bpm: soundData.bpm,
        key: soundData.key,
        tags: {
          connect: soundData.tags.map(tag => ({ id: tag.id })),
        },
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 