using System.Text.RegularExpressions;

namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – implements the Bionic Reading algorithm.
    ///
    /// OOP Principles:
    ///   • Inheritance   – extends StudyTool; participates in the polymorphic hierarchy.
    ///   • Encapsulation – font size and bionic-mode state are private; exposed only
    ///                     through read-only properties and high-level methods.
    ///   • Polymorphism  – Initialize() sets default reader settings; Reset() clears
    ///                     any runtime overrides back to those defaults.
    ///
    /// Algorithm:
    ///   Bolds the first ~40 % of each word (the "fixation point") to accelerate
    ///   reading comprehension – the core principle of Bionic Reading®.
    /// </summary>
    public class AdaptiveReaderService : FocusFlow.Models.StudyTool
    {
        // ── Private State (Encapsulation) ─────────────────────────────────────
        private const int DefaultFontSize   = 16;   // px
        private const int MinFontSize       = 12;
        private const int MaxFontSize       = 32;
        private const bool DefaultBionicOn  = true;

        private int  _fontSize;
        private bool _bionicModeEnabled;

        // ── Constructor ───────────────────────────────────────────────────────

        public AdaptiveReaderService()
        {
            ToolName = "Adaptive Reader";
            Initialize();
        }

        // ── Abstract Method Implementations (Polymorphism) ────────────────────

        /// <summary>
        /// Sets default font size and enables Bionic mode.
        /// Safe to call at any time to restore factory settings.
        /// </summary>
        public override void Initialize()
        {
            _fontSize          = DefaultFontSize;
            _bionicModeEnabled = DefaultBionicOn;
            IsActive           = false;
        }

        /// <summary>
        /// Resets all runtime overrides (font size, bionic toggle) back to defaults.
        /// Delegates to Initialize() for a single source of truth on "default state".
        /// </summary>
        public override void Reset()
        {
            Initialize();
        }

        // ── Public Read-Only Properties ───────────────────────────────────────

        /// <summary>Current font size (px). Read-only externally.</summary>
        public int FontSize => _fontSize;

        /// <summary>Whether Bionic Reading mode is currently active.</summary>
        public bool BionicModeEnabled => _bionicModeEnabled;

        // ── Public API ────────────────────────────────────────────────────────

        /// <summary>
        /// High-level entry point: processes text and returns HTML with Bionic
        /// fixation points, respecting the current BionicModeEnabled setting.
        /// If Bionic mode is disabled, returns the raw input unchanged.
        /// </summary>
        public string ApplyBionicFormatting(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;
            return _bionicModeEnabled ? ApplyFixationPoints(input) : input;
        }

        /// <summary>
        /// Legacy alias kept for backward compatibility with FocusController.
        /// Delegates to ApplyBionicFormatting().
        /// </summary>
        public string ProcessBionicText(string input) => ApplyBionicFormatting(input);

        /// <summary>Toggles Bionic Reading mode on/off. Returns the new state.</summary>
        public bool ToggleBionicMode()
        {
            _bionicModeEnabled = !_bionicModeEnabled;
            return _bionicModeEnabled;
        }

        /// <summary>
        /// Sets a custom font size, clamped to [MinFontSize, MaxFontSize].
        /// </summary>
        /// <param name="sizePx">Desired font size in pixels.</param>
        public int SetFontSize(int sizePx)
        {
            _fontSize = Math.Clamp(sizePx, MinFontSize, MaxFontSize);
            return _fontSize;
        }

        /// <summary>Returns the current reader configuration as an anonymous snapshot.</summary>
        public object GetReaderSnapshot() =>
            new { FontSize = _fontSize, BionicModeEnabled = _bionicModeEnabled, IsActive };

        // ── Private Helpers (Encapsulation) ───────────────────────────────────

        /// <summary>
        /// Wraps the leading fixation syllable (~40 %) of every word in a
        /// &lt;strong&gt; tag to create the Bionic Reading® visual anchor.
        /// </summary>
        private static string ApplyFixationPoints(string input)
        {
            return Regex.Replace(input, @"\b(\w+)\b", m =>
            {
                string word = m.Groups[1].Value;
                int    mid  = (int)Math.Ceiling(word.Length * 0.4);
                return $"<strong>{word[..mid]}</strong>{word[mid..]}";
            });
        }
    }
}
