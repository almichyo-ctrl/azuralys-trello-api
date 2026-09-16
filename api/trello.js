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

    if (!process.env.TRELLO_KEY || !process.env.TRELLO_TOKEN) {
      return res.status(500).json({
        error: "TRELLO_KEY ou TRELLO_TOKEN manquant côté serveur (variables d'environnement Vercel).",
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

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Trello répond parfois en texte brut sur certaines erreurs
      data = { error: rawText || "Réponse vide de l'API Trello" };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur interne du serveur",
      detail: String(error?.message || error),
    });
  }
