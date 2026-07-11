import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AnswerLibrary } from '../core/library.js';

/**
 * asked-answered-mcp — exposes the approved-answer library as read-only MCP
 * tools, so the compliance knowledge your SMEs already approved in Slack is
 * reachable from Claude, Cursor, or the Slackbot MCP client.
 *
 * Both tools are readOnlyHint: this server can never write, approve, or
 * mutate anything. Writes happen only through the in-Slack approval flow.
 */
export function buildMcpServer(library: AnswerLibrary): McpServer {
  const server = new McpServer({ name: 'asked-answered-mcp', version: '0.1.0' });

  server.registerTool(
    'search_answers',
    {
      title: 'Search approved answers',
      description:
        'Search the library of SME-approved security-questionnaire answers. Returns approved answers with their id, question, answer text, and approver.',
      inputSchema: { query: z.string().min(2).describe('Keywords or a question to search for') },
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      const results = library.searchAnswers(query).map((a) => ({
        id: a.id,
        questionText: a.questionText,
        answerText: a.answerText,
        approvedBy: a.approvedBy,
        approvedAt: a.approvedAt,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    },
  );

  server.registerTool(
    'get_answer_provenance',
    {
      title: 'Get answer provenance',
      description:
        'Fetch the full provenance of an approved answer: its Slack evidence permalinks, approver, and approval timestamp.',
      inputSchema: { answerId: z.number().int().describe('The id returned by search_answers') },
      annotations: { readOnlyHint: true },
    },
    async ({ answerId }) => {
      const answer = library.getById(answerId);
      if (!answer) {
        return {
          isError: true,
          content: [{ type: 'text', text: `No approved answer with id ${answerId}` }],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                id: answer.id,
                questionText: answer.questionText,
                citations: answer.citations,
                approvedBy: answer.approvedBy,
                approvedAt: answer.approvedAt,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  return server;
}

// Entrypoint: `npm run mcp` serves the library over stdio.
const isMain = process.argv[1]?.endsWith('mcp/server.ts') || process.argv[1]?.endsWith('mcp/server.js');
if (isMain) {
  const dbPath = process.env.AA_DB_PATH ?? 'asked-and-answered.db';
  const server = buildMcpServer(AnswerLibrary.atPath(dbPath));
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`asked-answered-mcp serving ${dbPath} over stdio`);
}
