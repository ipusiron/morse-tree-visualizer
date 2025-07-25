export const morseTree = {
  label: "start",
  left: {
    label: "E",
    left: {
      label: "I",
      left: {
        label: "S",
        left: {
          label: "H",
          left: { label: "5" },
          right: { label: "4" }
        },
        right: {
          label: "V",
          right: { label: "3" }
        }
      },
      right: {
        label: "U",
        left: {
          label: "F"
        },
        right: {
          right: { label: "2" }
        }
      }
    },
    right: {
      label: "A",
      left: {
        label: "R",
        left: {
          label: "L"
        },
        right: {
          right: { label: "+" }
        }
      },
      right: {
        label: "W",
        left: {
          label: "P"
        },
        right: {
          label: "J",
          right: { label: "1" }
        }
      }
    }
  },
  right: {
    label: "T",
    left: {
      label: "N",
      left: {
        label: "D",
        left: {
          label: "B",
          left: { label: "6" },
          right: { label: "=" }
        },
        right: {
          label: "X",
          right: { label: "/" }
        }
      },
      right: {
        label: "K",
        left: {
          label: "C"
        },
        right: {
          label: "Y"
        }
      }
    },
    right: {
      label: "M",
      left: {
        label: "G",
        left: {
          label: "Z",
          left: { label: "7" }
        },
        right: {
          label: "Q"
        }
      },
      right: {
        label: "O",
        right: {
          right: {
            label: "0"
          }
        }
      }
    }
  }
};
