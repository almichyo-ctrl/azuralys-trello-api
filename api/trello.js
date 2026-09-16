const TRELLO_API = "https://api.trello.com/1";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée",
    });
  }

  try {
    const { action, payload = {} } = req.body || {};

    if (!action) {
      return res.status(400).json({
        error: "Action manquante",
      });
    }

    const allowedActions = {
      get_lists: {
        method: "GET",
        path: `/boards/${payload.boardId}/lists`,
      },

      get_cards: {
        method: "GET",
        path: `/lists/${payload.listId}/cards`,
      },

      create_card: {
        method: "POST",
        path: "/cards",
      },

      update_card: {
        method: "PUT",
        path: `/cards/${payload.cardId}`,
      },

      delete_card: {
        method: "DELETE",
        path: `/cards/${payload.cardId}`,
      },
    };

    const selected = allowedActions[action];

    if (!selected) {
      return res.status(400).json({
        error: "Action non autorisée",
      });
    }

    const params = new URLSearchParams({
      key: process.env.TRELLO_KEY,
      token: process.env.TRELLO_TOKEN,
    });

    for (const [key, value] of Object.entries(payload)) {
      if (key !== "boardId" && key !== "listId" && key !== "cardId" && value !== undefined) {
        params.set(key, String(value));
      }
    }

    const response = await fetch(
      `${TRELLO_API}${selected.path}?${params.toString()}`,
      {
        method: selected.method,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur interne du serveur",
    });
  }
}
