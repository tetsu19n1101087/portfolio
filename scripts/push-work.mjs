import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import { createClient } from 'microcms-js-sdk';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';

const SERVICE_DOMAIN = process.env.CMS_SERVICE_DOMAIN;
const API_KEY = process.env.CMS_WRITE_API_KEY || process.env.CMS_API_KEY;

function printHelp() {
  console.log(`
Usage:
  yarn works:push <path-to-markdown-file> [options]

Options:
  --dry-run     Parse markdown and show payload without sending to microCMS
  --draft       Save as draft in microCMS instead of publishing immediately
  --help, -h    Show this help message

Examples:
  yarn works:push drafts/my-work.md
  yarn works:push drafts/my-work.md --dry-run
`);
}

/**
 * Markdown processor with GFM & Shiki syntax highlighting
 */
const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeShiki, {
    theme: 'github-dark',
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

async function convertMarkdownToHtml(markdown) {
  const file = await markdownProcessor.process(markdown);
  return String(file);
}

/**
 * Resolve tag names to tag IDs via microCMS tags endpoint
 */
async function resolveTagIds(client, tagNames) {
  if (!tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
    return [];
  }

  try {
    const res = await client.get({
      endpoint: 'tags',
      queries: { limit: 100 },
    });
    const existingTags = res.contents || [];

    const resolvedIds = [];
    for (const name of tagNames) {
      const match = existingTags.find(
        (t) => t.name?.toLowerCase() === name.toLowerCase() || t.id === name
      );
      if (match) {
        resolvedIds.push(match.id);
      } else {
        console.warn(
          `⚠️  Tag "${name}" not found in microCMS. (Existing tags: ${existingTags.map((t) => t.name).join(', ')})`
        );
      }
    }
    return resolvedIds;
  } catch (err) {
    console.warn('⚠️  Could not fetch tags from microCMS. Skipping tag resolution:', err.message);
    return [];
  }
}

async function processFile(filePath, options) {
  const absolutePath = path.resolve(filePath);
  console.log(`\n📄 Processing file: ${filePath}`);

  let rawFile;
  try {
    rawFile = await fs.readFile(absolutePath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read file at ${filePath}: ${err.message}`, { cause: err });
  }

  const { data: frontmatter, content: markdownBody } = matter(rawFile);

  if (!frontmatter.title) {
    throw new Error('Frontmatter must contain a "title" field.');
  }

  // Derive contentId from frontmatter.id or filename slug
  const contentId = frontmatter.id || path.basename(filePath, path.extname(filePath));

  console.log(`   Content ID: ${contentId}`);
  console.log(`   Title: ${frontmatter.title}`);

  // Convert Markdown to HTML with Shiki syntax highlighting
  console.log('🔄 Converting Markdown to HTML with GFM & Shiki...');
  const htmlContent = await convertMarkdownToHtml(markdownBody);

  let client = null;
  if (!options.isDryRun) {
    if (!SERVICE_DOMAIN || !API_KEY) {
      throw new Error(
        'CMS_SERVICE_DOMAIN and CMS_WRITE_API_KEY (or CMS_API_KEY) must be set in environment (.env).'
      );
    }
    client = createClient({
      serviceDomain: SERVICE_DOMAIN,
      apiKey: API_KEY,
    });
  }

  // Resolve tags
  let tagIds = [];
  if (frontmatter.tags && frontmatter.tags.length > 0) {
    if (client) {
      tagIds = await resolveTagIds(client, frontmatter.tags);
    } else {
      console.log(`   Tags specified: ${frontmatter.tags.join(', ')} (Dry run: resolution skipped)`);
    }
  }

  // Build microCMS payload
  const content = {
    title: frontmatter.title,
    description: frontmatter.description || '',
    date: frontmatter.date || new Date().toISOString().split('T')[0],
    text: htmlContent,
  };

  if (frontmatter.demoLink) content.demoLink = frontmatter.demoLink;
  if (frontmatter.codeLink) content.codeLink = frontmatter.codeLink;

  if (frontmatter.image) {
    content.image =
      typeof frontmatter.image === 'string' ? frontmatter.image : frontmatter.image?.url;
  }

  if (frontmatter.images && Array.isArray(frontmatter.images)) {
    content.images = frontmatter.images
      .map((img) => (typeof img === 'string' ? img : img?.url))
      .filter(Boolean);
  }

  if (tagIds.length > 0) {
    content.tags = tagIds;
  }

  if (options.isDryRun) {
    console.log('\n--- [DRY RUN PAYLOAD] ---');
    console.log('Endpoint: works');
    console.log('Content ID:', contentId);
    console.log('Status:', options.isDraft ? 'draft' : 'published');
    console.log('Metadata:', {
      title: content.title,
      description: content.description,
      date: content.date,
      tags: tagIds.length > 0 ? tagIds : frontmatter.tags,
      demoLink: content.demoLink,
      codeLink: content.codeLink,
      image: content.image,
      images: content.images,
    });
    console.log('\nGenerated HTML preview (first 400 chars):');
    console.log(htmlContent.slice(0, 400) + (htmlContent.length > 400 ? '...' : ''));
    console.log('--- [END DRY RUN] ---\n');
    console.log('✨ Dry run completed successfully! No changes were sent to microCMS.');
    return;
  }

  // Check if content already exists
  let exists = false;
  try {
    await client.get({
      endpoint: 'works',
      contentId,
    });
    exists = true;
  } catch {
    // Content does not exist in microCMS yet
  }

  if (exists) {
    console.log(`🚀 Updating existing work (${contentId}) in microCMS...`);
    await client.update({
      endpoint: 'works',
      contentId,
      content,
      isDraft: options.isDraft,
    });
    console.log(`✅ Successfully updated "${contentId}" in microCMS!`);
  } else {
    console.log(`🚀 Creating new work (${contentId}) in microCMS...`);
    await client.create({
      endpoint: 'works',
      contentId,
      content,
      isDraft: options.isDraft,
    });
    console.log(`✅ Successfully created "${contentId}" in microCMS!`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const isDryRun = args.includes('--dry-run');
  const isDraft = args.includes('--draft');
  const filePaths = args.filter((arg) => !arg.startsWith('--') && !arg.startsWith('-'));

  if (filePaths.length === 0) {
    console.error('Error: Please provide at least one Markdown file path.');
    printHelp();
    process.exit(1);
  }

  for (const filePath of filePaths) {
    await processFile(filePath, { isDryRun, isDraft });
  }
}

main().catch((err) => {
  console.error('\n❌ Error pushing work to microCMS:', err.message);
  process.exit(1);
});
