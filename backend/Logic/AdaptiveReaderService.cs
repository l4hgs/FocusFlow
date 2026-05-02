using System.Text.RegularExpressions;

namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – implements the Bionic Reading algorithm.
    /// Bolds the first 40 % of each word to accelerate reading comprehension.
    /// </summary>
    public class AdaptiveReaderService
    {
        /// <summary>
        /// Wraps the leading syllable of every word in a &lt;strong&gt; tag.
        /// </summary>
        public string ProcessBionicText(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;

            return Regex.Replace(input, @"\b(\w+)\b", m =>
            {
                string word = m.Groups[1].Value;
                int mid = (int)Math.Ceiling(word.Length * 0.4);
                return $"<strong>{word[..mid]}</strong>{word[mid..]}";
            });
        }
    }
}
