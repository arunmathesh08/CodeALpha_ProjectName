require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./config/db');

// Import all models
const User = require('./models/User');
const Community = require('./models/Community');
const CommunityMember = require('./models/CommunityMember');
const Post = require('./models/Post');
const PostLike = require('./models/PostLike');
const PostVote = require('./models/PostVote');
const Comment = require('./models/Comment');
const CommentLike = require('./models/CommentLike');
const Follower = require('./models/Follower');
const SavedPost = require('./models/SavedPost');
const Notification = require('./models/Notification');

const seedData = async (keepOpen = false) => {
  try {
    console.log('[Seed] Connecting / verifying database...');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Community.deleteMany({}),
      CommunityMember.deleteMany({}),
      Post.deleteMany({}),
      PostLike.deleteMany({}),
      PostVote.deleteMany({}),
      Comment.deleteMany({}),
      CommentLike.deleteMany({}),
      Follower.deleteMany({}),
      SavedPost.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Creating Users...');
    // Default password for all seed users is Password@123
    const usersData = [
      {
        username: 'alexkumar',
        email: 'alex@connecthub.com',
        password: 'Password@123',
        fullName: 'Alex Kumar',
        bio: 'Full-stack builder, open-source enthusiast, and tech minimalist. Exploring distributed systems and clean UI design.',
        location: 'Bengaluru, India',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      },
      {
        username: 'priyasharma',
        email: 'priya@connecthub.com',
        password: 'Password@123',
        fullName: 'Priya Sharma',
        bio: 'AI researcher & product designer. Writing about machine learning breakthroughs, neural interfaces, and humane tech.',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      },
      {
        username: 'rahuldev',
        email: 'rahul@connecthub.com',
        password: 'Password@123',
        fullName: 'Rahul Dev',
        bio: 'Game developer & 3D artist. Building interactive worlds with Unreal Engine 5 and WebGL. Gaming setup tinkerer.',
        location: 'Austin, TX',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      },
      {
        username: 'sarahthomas',
        email: 'sarah@connecthub.com',
        password: 'Password@123',
        fullName: 'Sarah Thomas',
        bio: 'Cinema curator, screenwriter, and film essayist. Deep dives into cinematography, indie films, and modern storytelling.',
        location: 'London, UK',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await User.create(u);
      createdUsers.push(user);
    }

    const [alex, priya, rahul, sarah] = createdUsers;

    console.log('[Seed] Setting up follows...');
    // Alex follows Priya and Rahul
    // Priya follows Alex and Sarah
    // Rahul follows Alex, Priya, Sarah
    // Sarah follows Priya and Rahul
    await Follower.create([
      { follower: alex._id, following: priya._id },
      { follower: alex._id, following: rahul._id },
      { follower: priya._id, following: alex._id },
      { follower: priya._id, following: sarah._id },
      { follower: rahul._id, following: alex._id },
      { follower: rahul._id, following: priya._id },
      { follower: rahul._id, following: sarah._id },
      { follower: sarah._id, following: priya._id },
      { follower: sarah._id, following: rahul._id },
    ]);

    console.log('[Seed] Creating 9 Communities...');
    const communitiesData = [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'A space for discussing futuristic hardware, software developments, ethical tech, and industry news.',
        icon: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        category: 'Tech',
        creator: alex._id,
        rules: [
          { title: 'Source your news', description: 'Provide verifiable sources when sharing breaking tech news.' },
          { title: 'No platform bashing', description: 'Constructive criticism is welcome; blind hate is not.' },
        ],
      },
      {
        name: 'Programming',
        slug: 'programming',
        description: 'Everything code. From JavaScript architectures to Rust memory safety, algorithms, and developer careers.',
        icon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        category: 'Development',
        creator: alex._id,
        rules: [
          { title: 'Format code properly', description: 'Use markdown code fences for readability.' },
          { title: 'Explain your questions', description: 'Include stack traces and reproducible examples.' },
        ],
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Esports, game mechanics, indie gems, retro classics, and high-performance gaming gear discussions.',
        icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        category: 'Entertainment',
        creator: rahul._id,
        rules: [
          { title: 'Mark spoilers', description: 'Please tag spoilers for story-driven releases.' },
          { title: 'Be welcoming to beginners', description: 'Encourage new players and hobbyists.' },
        ],
      },
      {
        name: 'Movies',
        slug: 'movies',
        description: 'Film critiques, cinematography breakdowns, director retrospectives, and recommendations across all eras.',
        icon: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
        category: 'Cinema',
        creator: sarah._id,
        rules: [
          { title: 'No major spoilers in titles', description: 'Keep plot twists inside designated spoiler tags.' },
          { title: 'Respect diverse artistic tastes', description: 'Art is subjective—engage with thoughtfulness.' },
        ],
      },
      {
        name: 'Education',
        slug: 'education',
        description: 'Lifelong learning, student resources, career roadmaps, book clubs, and academic discussions.',
        icon: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
        category: 'Learning',
        creator: priya._id,
        rules: [
          { title: 'Credible references', description: 'Back up claims with factual studies and links.' },
        ],
      },
      {
        name: 'AI',
        slug: 'ai',
        description: 'Large language models, diffusion systems, robotics, alignment research, and the real-world impact of AI.',
        icon: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
        category: 'Tech',
        creator: priya._id,
        rules: [
          { title: 'Label AI-generated media', description: 'Clearly tag synthetic art and code prompts.' },
        ],
      },
      {
        name: 'Sports',
        slug: 'sports',
        description: 'Live match banter, athletic performance, fitness science, football, basketball, cricket, and F1.',
        icon: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        category: 'Fitness',
        creator: rahul._id,
        rules: [
          { title: 'Keep rivalry friendly', description: 'No toxic harassment of rival teams.' },
        ],
      },
      {
        name: 'Memes',
        slug: 'memes',
        description: 'The finest internet culture, high-tier original memes, relatable humor, and witty observations.',
        icon: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
        category: 'Humor',
        creator: alex._id,
        rules: [
          { title: 'Original & creative humor', description: 'Low-effort reposts may be moderated.' },
        ],
      },
      {
        name: 'College Life',
        slug: 'college-life',
        description: 'Campus hacks, hostel stories, exam survival tips, internships, and student project collaborations.',
        icon: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
        category: 'Life',
        creator: priya._id,
        rules: [
          { title: 'Support your peers', description: 'Share authentic experiences and advice.' },
        ],
      },
    ];

    const createdCommunities = [];
    for (const c of communitiesData) {
      const comm = await Community.create(c);
      createdCommunities.push(comm);

      // Add all 4 users to each community with varying roles
      for (const u of createdUsers) {
        const role = comm.creator.toString() === u._id.toString() ? 'admin' : 'member';
        await CommunityMember.create({
          user: u._id,
          community: comm._id,
          role,
        });
      }
      comm.memberCount = 4;
      await comm.save();
    }

    const [techComm, progComm, gameComm, movieComm, eduComm, aiComm, sportComm, memeComm, collegeComm] = createdCommunities;

    console.log('[Seed] Creating 26+ rich posts...');
    const postsData = [
      {
        title: 'Why vanilla JavaScript and semantic HTML still outperform heavyweight frontend bundles in 2026',
        content: 'There is immense satisfaction in shipping an application with 0kb client framework overhead. Fast initial render, crystal clear DOM tree inspection, and zero dependency fatigue.\n\nModern Web APIs provide native DOM manipulation, standard Web Components, CSS nesting, and Fetch API that remove the need for massive client runtimes in many applications.',
        postType: 'text',
        author: alex._id,
        community: progComm._id,
        tags: ['JavaScript', 'WebDev', 'Performance'],
        upvotesCount: 38,
        downvotesCount: 2,
        score: 36,
        likesCount: 24,
      },
      {
        title: 'Anthropic & OpenAI release multimodal reasoning models that parse real-time architectural schematics',
        content: 'The new wave of vision-language models now parses complex blueprint diagrams, logic gates, and layered CAD files directly into structured code and mathematical representations.',
        postType: 'link',
        linkUrl: 'https://arxiv.org/abs/2403.05530',
        mediaUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1000&q=80',
        author: priya._id,
        community: aiComm._id,
        tags: ['AI', 'Research', 'MachineLearning'],
        upvotesCount: 52,
        downvotesCount: 1,
        score: 51,
        likesCount: 42,
      },
      {
        title: 'Built my dream custom mechanical keyboard with brass plate and hand-lubed linear switches!',
        content: 'Finally completed my 75% custom board build. Used Gateron Oil Kings, brass plate for that deep acoustic thock, and custom PBT retro keycaps. Typing feels like pure silk.',
        postType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
        author: rahul._id,
        community: techComm._id,
        tags: ['Keyboards', 'Setup', 'Hardware'],
        upvotesCount: 45,
        downvotesCount: 0,
        score: 45,
        likesCount: 38,
      },
      {
        title: 'Dune Part Two and Oppenheimer: The renaissance of large format 70mm IMAX cinema experience',
        content: 'Watching movies shot natively on 65mm/70mm IMAX film stock reminded everyone why theatrical cinema is unmatched. The sheer dynamic range, tactile film grain, and immersive sound engineering created visceral experiences.',
        postType: 'text',
        author: sarah._id,
        community: movieComm._id,
        tags: ['Cinema', 'IMAX', 'FilmReview'],
        upvotesCount: 64,
        downvotesCount: 3,
        score: 61,
        likesCount: 50,
      },
      {
        title: 'How to build an intuitive mental model for asynchronous programming and event loops',
        content: 'Think of the JavaScript call stack as a chef executing orders one by one. The Web APIs (like setTimeout and fetch) are the sous-chefs handling oven timers in the background. The microtask and macrotask queues are the prep station queues waiting for the chef to finish the current dish.',
        postType: 'text',
        author: alex._id,
        community: eduComm._id,
        tags: ['Learning', 'Coding', 'Tutorial'],
        upvotesCount: 29,
        downvotesCount: 1,
        score: 28,
        likesCount: 19,
      },
      {
        title: 'Unreal Engine 5.4 Nanite Tessellation and Lumen running at 120FPS on modern GPUs',
        content: 'Tested the updated Nanite pipeline with adaptive tessellation. The micro-geometric fidelity on rocky terrain without handcrafted LODs is unbelievable. Real-time game development has advanced more in 4 years than the previous decade.',
        postType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
        author: rahul._id,
        community: gameComm._id,
        tags: ['UnrealEngine', 'GameDev', 'Graphics'],
        upvotesCount: 41,
        downvotesCount: 2,
        score: 39,
        likesCount: 31,
      },
      {
        title: 'When you fix a bug in production at 4:59 PM on a Friday and deploy immediately',
        content: 'Narrator: It was not, in fact, just a one-line CSS fix.',
        postType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
        author: alex._id,
        community: memeComm._id,
        tags: ['DevHumor', 'FridayDeploy', 'Memes'],
        upvotesCount: 78,
        downvotesCount: 1,
        score: 77,
        likesCount: 65,
      },
      {
        title: 'Essential survival kit for engineering college mid-terms: habits, sleep schedules, and tools',
        content: '1. Pomodoro in 50/10 intervals\n2. Obsidian for interconnected concept notes\n3. Consistent 7 hours of sleep before exam mornings\n4. Active recall flashcards over passive re-reading\n5. Group study sessions strictly limited to problem-solving',
        postType: 'text',
        author: priya._id,
        community: collegeComm._id,
        tags: ['College', 'StudyHacks', 'Productivity'],
        upvotesCount: 33,
        downvotesCount: 0,
        score: 33,
        likesCount: 28,
      },
      {
        title: 'The art of color grading in David Fincher and Denis Villeneuve films',
        content: 'Notice how Fincher relies on controlled amber-green palettes in interior spaces to invoke clinical precision, whereas Villeneuve utilizes stark, desaturated monolithic monochromes juxtaposed with bright ambient lighting to convey vast alienation.',
        postType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1518134346374-184f9d21cb39?auto=format&fit=crop&w=1000&q=80',
        author: sarah._id,
        community: movieComm._id,
        tags: ['Cinematography', 'ColorGrading', 'FilmTheory'],
        upvotesCount: 49,
        downvotesCount: 1,
        score: 48,
        likesCount: 35,
      },
      {
        title: 'Formula 1 Aerodynamics: How Ground Effect Venturi tunnels transformed downforce generation',
        content: 'Since the 2022 regulation overhaul, cars generate over 60% of their total downforce directly beneath the floor via Venturi underbody tunnels. This reduced wake turbulence and made wheel-to-wheel overtaking dramatically closer.',
        postType: 'text',
        author: rahul._id,
        community: sportComm._id,
        tags: ['Formula1', 'Engineering', 'Motorsport'],
        upvotesCount: 36,
        downvotesCount: 2,
        score: 34,
        likesCount: 27,
      },
      {
        title: 'Clean Architecture in Node.js: Structuring controllers, services, and domain models without bloat',
        content: 'Keep routes thin, isolate business rules in domain services, and let controllers strictly handle HTTP contracts and validation. This keeps testing frictionless and database swaps painless.',
        postType: 'text',
        author: alex._id,
        community: progComm._id,
        tags: ['NodeJS', 'Backend', 'CleanCode'],
        upvotesCount: 47,
        downvotesCount: 1,
        score: 46,
        likesCount: 39,
      },
      {
        title: 'DeepSeek and Llama 3 open weights are changing the open-source AI landscape forever',
        content: 'The performance parity between open-weights models and proprietary frontier models is closing rapidly. Local inference on consumer hardware with quantized GGUF weights allows developers full sovereignty over their data.',
        postType: 'link',
        linkUrl: 'https://huggingface.co/blog',
        mediaUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1000&q=80',
        author: priya._id,
        community: aiComm._id,
        tags: ['OpenSource', 'AI', 'Llama3'],
        upvotesCount: 62,
        downvotesCount: 2,
        score: 60,
        likesCount: 53,
      },
      {
        title: 'Top 5 cozy indie games to relax with after a long week of debugging code',
        content: '1. A Short Hike\n2. Dave the Diver\n3. Gris\n4. Dorfromantik\n5. Sea of Stars\n\nWhat are your favorite low-stress comfort games?',
        postType: 'text',
        author: rahul._id,
        community: gameComm._id,
        tags: ['IndieGames', 'Gaming', 'Relaxation'],
        upvotesCount: 38,
        downvotesCount: 0,
        score: 38,
        likesCount: 30,
      },
      {
        title: 'Studio Ghibli aesthetic: Why hand-drawn water animation hits differently than 3D CGI',
        content: 'Hayao Miyazaki insisted on hand-painting water droplets, clouds, and morning dew frame-by-frame. The expressive, fluid imperfection carries an emotional warmth that hyper-realistic procedural shaders often struggle to evoke.',
        postType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
        author: sarah._id,
        community: movieComm._id,
        tags: ['Animation', 'StudioGhibli', 'Miyazaki'],
        upvotesCount: 55,
        downvotesCount: 1,
        score: 54,
        likesCount: 44,
      },
      {
        title: 'A curated roadmap to master Data Structures & Algorithms from first principles',
        content: 'Start with pointers and contiguous memory layouts (Arrays vs Linked Lists), master tree traversals (BFS & DFS recursion), understand topological sorting in Directed Acyclic Graphs, and conquer Dynamic Programming with memoization tables.',
        postType: 'text',
        author: alex._id,
        community: eduComm._id,
        tags: ['DSA', 'Algorithms', 'ComputerScience'],
        upvotesCount: 41,
        downvotesCount: 1,
        score: 40,
        likesCount: 36,
      },
      {
        title: 'The subtle beauty of dark-mode UI design: Contrast ratios, elevation, and deep slate hues',
        content: 'Never use pure black #000000 against pure white #FFFFFF. Instead, use rich dark slates (like #0B0F19 or #121826) with soft off-whites (#E2E8F0) and subtle translucent border highlights to create natural visual depth.',
        postType: 'text',
        author: priya._id,
        community: techComm._id,
        tags: ['UIDesign', 'CSS', 'DesignSystem'],
        upvotesCount: 59,
        downvotesCount: 0,
        score: 59,
        likesCount: 51,
      },
      {
        title: 'Building a retro arcade cabinet with Raspberry Pi 5 and CRT shader emulation',
        content: 'Crafted a mini bartop arcade cabinet with custom sanwa buttons and arcade sticks. Running RetroPie with dynamic scanline shaders gives that authentic 90s nostalgia without the bulk of a 50kg CRT monitor.',
        postType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
        author: rahul._id,
        community: techComm._id,
        tags: ['RetroGaming', 'DIY', 'RaspberryPi'],
        upvotesCount: 37,
        downvotesCount: 0,
        score: 37,
        likesCount: 29,
      },
      {
        title: 'Frontend developers explaining why changing button padding broke the user authentication flow',
        content: '"Technically, the z-index overlay intercepted the pointer-events on the shadow boundary during hydration."',
        postType: 'text',
        author: alex._id,
        community: memeComm._id,
        tags: ['CSS', 'WebDevMemes', 'Humor'],
        upvotesCount: 68,
        downvotesCount: 2,
        score: 66,
        likesCount: 55,
      },
      {
        title: 'Navigating college hackathons: How our team shipped a working prototype in 36 hours',
        content: 'Rule #1: Scope down aggressively in hour 2.\nRule #2: Pick boring, bulletproof tech you already know.\nRule #3: Spend the last 4 hours on the pitch deck and live demo script, not edge-case features.',
        postType: 'text',
        author: priya._id,
        community: collegeComm._id,
        tags: ['Hackathon', 'College', 'Startups'],
        upvotesCount: 34,
        downvotesCount: 0,
        score: 34,
        likesCount: 26,
      },
      {
        title: 'Why Nolan’s Interstellar docking scene soundtrack remains a masterclass in musical tension',
        content: 'Hans Zimmer’s "No Time For Caution" uses an escalating pipe organ cadence that mimics a ticking second-hand while crescendoing into breathless harmonic resonance. Pure cinematic adrenaline.',
        postType: 'link',
        linkUrl: 'https://www.youtube.com/watch?v=m3zvVGJrJA8',
        author: sarah._id,
        community: movieComm._id,
        tags: ['Soundtrack', 'HansZimmer', 'Interstellar'],
        upvotesCount: 46,
        downvotesCount: 1,
        score: 45,
        likesCount: 39,
      },
      {
        title: 'Building high-throughput microservices with Go channels and worker pools',
        content: 'Go concurrency model with goroutines and bounded worker channels lets you easily process hundreds of thousands of concurrent queue jobs with minimal memory overhead.',
        postType: 'text',
        author: alex._id,
        community: progComm._id,
        tags: ['Golang', 'Concurrency', 'Microservices'],
        upvotesCount: 31,
        downvotesCount: 0,
        score: 31,
        likesCount: 25,
      },
      {
        title: 'Modern strength training: Why progressive overload beats random workout routines every single time',
        content: 'Track your reps, add 1.25kg incrementally, prioritize multi-joint compound movements (squat, hinge, press, pull), and focus on weekly volume rather than chasing muscle soreness.',
        postType: 'text',
        author: rahul._id,
        community: sportComm._id,
        tags: ['Fitness', 'Health', 'StrengthTraining'],
        upvotesCount: 28,
        downvotesCount: 1,
        score: 27,
        likesCount: 21,
      },
      {
        title: 'Generative diffusion models vs Autoregressive visual transformers: What is the future?',
        content: 'While latent diffusion dominates image generation today, autoregressive next-patch prediction models (like Sora and Chameleon) demonstrate remarkable emergent physical world understanding.',
        postType: 'text',
        author: priya._id,
        community: aiComm._id,
        tags: ['AI', 'Diffusion', 'VisionTransformers'],
        upvotesCount: 43,
        downvotesCount: 2,
        score: 41,
        likesCount: 33,
      },
      {
        title: 'My top 5 cinematography recommendations for visual storytellers and photography lovers',
        content: '1. In the Mood for Love (Christopher Doyle)\n2. Blade Runner 2049 (Roger Deakins)\n3. The Grand Budapest Hotel (Robert Yeoman)\n4. Roma (Alfonso Cuarón)\n5. Barry Lyndon (John Alcott)',
        postType: 'text',
        author: sarah._id,
        community: movieComm._id,
        tags: ['Cinematography', 'FilmList', 'Photography'],
        upvotesCount: 51,
        downvotesCount: 0,
        score: 51,
        likesCount: 47,
      },
      {
        title: 'How to manage college finances and student budget without eating instant ramen every night',
        content: 'Batch cooking weekly meals, sharing subscription services, taking advantage of student discounts on GitHub/JetBrains/Apple, and building a 3-month emergency fund early on makes campus life stress-free.',
        postType: 'text',
        author: priya._id,
        community: collegeComm._id,
        tags: ['StudentLife', 'Finance', 'Budgeting'],
        upvotesCount: 32,
        downvotesCount: 0,
        score: 32,
        likesCount: 26,
      },
      {
        title: 'Git commits be like: initial commit -> fix bug -> fix fix -> final -> final_v2_reallyfinal',
        content: 'The universal truth of developer version control history right before a deadline.',
        postType: 'text',
        author: alex._id,
        community: memeComm._id,
        tags: ['Git', 'DeveloperMemes', 'Humor'],
        upvotesCount: 71,
        downvotesCount: 1,
        score: 70,
        likesCount: 62,
      },
    ];

    const createdPosts = [];
    for (const p of postsData) {
      const post = await Post.create(p);
      createdPosts.push(post);
      await User.findByIdAndUpdate(p.author, { $inc: { postsCount: 1 } });
      await Community.findByIdAndUpdate(p.community, { $inc: { postsCount: 1 } });
    }

    console.log('[Seed] Adding Likes and Votes on posts...');
    for (const post of createdPosts) {
      // Alex, Priya, Rahul like various posts
      await PostLike.create([
        { user: alex._id, post: post._id },
        { user: priya._id, post: post._id },
      ]);
      await PostVote.create([
        { user: alex._id, post: post._id, voteType: 1 },
        { user: priya._id, post: post._id, voteType: 1 },
        { user: rahul._id, post: post._id, voteType: 1 },
      ]);
    }

    console.log('[Seed] Creating nested threaded comments...');
    // Comment tree on Post 1 (Vanilla JS post)
    const p1 = createdPosts[0];
    const c1 = await Comment.create({
      post: p1._id,
      author: priya._id,
      content: 'Completely agree! The ergonomics of modern CSS variables, Grid, and standard Fetch have eliminated 80% of the reasons we used to reach for heavy libraries.',
      depth: 0,
      likesCount: 12,
      repliesCount: 2,
    });

    const c1_reply1 = await Comment.create({
      post: p1._id,
      author: alex._id,
      content: 'Exactly Priya. Plus, debugging is so much faster when you can just read the elements directly in Chrome DevTools without 20 layers of virtual DOM wrappers.',
      parentComment: c1._id,
      depth: 1,
      likesCount: 8,
      repliesCount: 1,
    });

    const c1_reply1_nested = await Comment.create({
      post: p1._id,
      author: rahul._id,
      content: 'And page load speeds on mobile networks are instantaneous. Truly underrated approach!',
      parentComment: c1_reply1._id,
      depth: 2,
      likesCount: 5,
      repliesCount: 0,
    });

    const c1_reply2 = await Comment.create({
      post: p1._id,
      author: sarah._id,
      content: 'As someone who cares deeply about typography and rendering performance, vanilla builds always feel buttery smooth.',
      parentComment: c1._id,
      depth: 1,
      likesCount: 4,
      repliesCount: 0,
    });

    // Update post commentsCount
    p1.commentsCount = 4;
    await p1.save();

    // Comment tree on Post 2 (AI Post)
    const p2 = createdPosts[1];
    const c2 = await Comment.create({
      post: p2._id,
      author: alex._id,
      content: 'The CAD file parsing capability is mind-blowing. Imagine generating physical prototypes with automated 3D printing slicing directly from hand sketches.',
      depth: 0,
      likesCount: 9,
      repliesCount: 1,
    });

    const c2_reply = await Comment.create({
      post: p2._id,
      author: priya._id,
      content: 'We are already seeing early integrations in architecture firms where zoning compliance is checked in real-time!',
      parentComment: c2._id,
      depth: 1,
      likesCount: 6,
      repliesCount: 0,
    });

    p2.commentsCount = 2;
    await p2.save();

    // Comment tree on Post 4 (Movies Post)
    const p4 = createdPosts[3];
    const c4 = await Comment.create({
      post: p4._id,
      author: rahul._id,
      content: 'The sound mix during the sandworm ride in Dune Part 2 shook the entire cinema hall. Pure spectacle.',
      depth: 0,
      likesCount: 15,
      repliesCount: 1,
    });

    const c4_reply = await Comment.create({
      post: p4._id,
      author: sarah._id,
      content: 'Greig Fraser’s use of infrared cameras for the Giedi Prime arena sequence was pure genius as well.',
      parentComment: c4._id,
      depth: 1,
      likesCount: 11,
      repliesCount: 0,
    });

    p4.commentsCount = 2;
    await p4.save();

    // Add comment likes
    await CommentLike.create([
      { user: alex._id, comment: c1._id },
      { user: priya._id, comment: c1._id },
      { user: rahul._id, comment: c1_reply1._id },
      { user: sarah._id, comment: c4._id },
    ]);

    console.log('[Seed] Creating Saved Posts...');
    await SavedPost.create([
      { user: alex._id, post: createdPosts[1]._id },
      { user: alex._id, post: createdPosts[3]._id },
      { user: priya._id, post: createdPosts[0]._id },
      { user: rahul._id, post: createdPosts[5]._id },
    ]);

    console.log('[Seed] Creating Notifications...');
    await Notification.create([
      {
        recipient: alex._id,
        sender: priya._id,
        type: 'comment_post',
        post: p1._id,
        comment: c1._id,
        message: 'Priya Sharma commented on your post "Why vanilla JavaScript and semantic HTML..."',
        isRead: false,
      },
      {
        recipient: alex._id,
        sender: rahul._id,
        type: 'follow_user',
        message: 'Rahul Dev started following you.',
        isRead: false,
      },
      {
        recipient: alex._id,
        sender: sarah._id,
        type: 'vote_post',
        post: p1._id,
        message: 'Sarah Thomas upvoted your post.',
        isRead: true,
      },
      {
        recipient: priya._id,
        sender: alex._id,
        type: 'reply_comment',
        post: p1._id,
        comment: c1_reply1._id,
        message: 'Alex Kumar replied to your comment: "Exactly Priya. Plus, debugging is so much faster..."',
        isRead: false,
      },
    ]);

    console.log('[Seed] ✅ Database seeding completed successfully!');
    console.log('---------------------------------------------');
    console.log('Demo Accounts (Password: Password@123):');
    console.log('1. alex@connecthub.com   (@alexkumar)');
    console.log('2. priya@connecthub.com  (@priyasharma)');
    console.log('3. rahul@connecthub.com  (@rahuldev)');
    console.log('4. sarah@connecthub.com  (@sarahthomas)');
    console.log('---------------------------------------------');

    if (!keepOpen) {
      await disconnectDB();
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error('[Seed Error]', err);
    if (!keepOpen) process.exit(1);
    throw err;
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedData };
