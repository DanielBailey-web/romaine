import type { RomaineState, HistoryAction, RomaineHistory } from ".";
export type PushHistory = () => void;

/**
 *
 * @param state RomaineState
 * @param payload HistoryAction["payload"]
 * @todo
 * 1) reduce rotation to one command if previous history is also rotation
 */
export const history = (
  state: RomaineState,
  payload: HistoryAction["payload"]
): RomaineState => {
  switch (payload.cmd) {
    case "CLEAR":
      // overwrite with empty array
      return {
        ...state,
        history: { commands: [], pointer: 0 },
      };
    case "PUSH":
      if (state.mode === "undo" || state.mode === "redo" || state.mode === null)
        return { ...state };
      const pointer = state.history.pointer;
      let newCommands = state.history.commands;
      if (pointer < newCommands.length) {
        newCommands = state.history.commands.reduce(
          (a, c, i) => (pointer > i ? [...a, c] : a),
          [] as typeof state.history.commands
        );
      }
      return {
        ...state,
        history: {
          ...state.history,
          commands: [...newCommands, getHistoryFromState(state)],
          pointer: pointer + 1,
        },
      };
    case "UNDO": {
      const pointer = state.history.pointer;
      return {
        ...state,
        history: { ...state.history, pointer: pointer ? pointer - 1 : 0 },
      };
    }
    case "REDO": {
      const pointer = state.history.pointer;
      return {
        ...state,
        history: { ...state.history, pointer: pointer ? pointer - 1 : 0 },
      };
    }
    default:
      return { ...state };
  }
};

const getHistoryFromState = ({
  mode,
  angle,
  cropPoints,
}: RomaineState): RomaineHistory => {
  switch (mode) {
    case "rotate-left":
      return { cmd: mode, payload: angle % 360 };
    case "rotate-right":
      return { cmd: mode, payload: (360 - angle) % 360 };
    case "crop":
      console.warn("need to add crop points to history");
      return { cmd: mode, payload: cropPoints };
    case "perspective-crop":
      console.warn("need to add crop points to history");
      return { cmd: mode, payload: cropPoints };
    case "full-reset":
      throw new Error(
        'error: action "full-reset" should not call `history`.`PUSH`'
      ).stack;
    default:
      // handles null
      throw new Error(
        "error: action of type null should not call `history`.`PUSH`"
      ).stack;
  }
};
