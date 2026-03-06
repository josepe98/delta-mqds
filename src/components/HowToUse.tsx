export function HowToUse() {
  return (
    <div className="how-to-use">
      <h2>How to Use</h2>

      <div className="card">
        <h3>Getting Started</h3>
        <ol>
          <li>
            <strong>Export your MQD Account Activity.</strong> Log in to your account,
            go to your Account Activity page, and download the PDF.
          </li>
          <li>
            <strong>Import the PDF.</strong> Go to the <strong>Import</strong> tab, select the
            year you want to track, and drag or click to upload your PDF. The parser will
            extract all your MQD activity automatically.
          </li>
          <li>
            <strong>Review and confirm.</strong> Before importing, you can review the parsed
            entries. New entries, updates to pending flights, and duplicates are clearly labeled.
            Click <strong>Import</strong> to add them to your tracker.
          </li>
          <li>
            <strong>Set your target.</strong> Go to <strong>Settings</strong> to choose your
            Medallion status goal (Silver, Gold, Platinum, or Diamond).
          </li>
          <li>
            <strong>Configure your cards.</strong> Your Delta credit cards are auto-detected
            from the PDF. In <strong>Settings</strong>, enter your monthly spend for each card
            to power the spending forecast.
          </li>
          <li>
            <strong>Add anticipated trips.</strong> On the <strong>Dashboard</strong>, use the
            Anticipated Trips card to add future trips and their estimated MQDs.
          </li>
          <li>
            <strong>Track your progress.</strong> The Dashboard shows your earned, pending, and
            projected MQDs against your target with visual progress bars.
          </li>
        </ol>
      </div>

      <div className="card">
        <h3>Other Features</h3>
        <ul>
          <li>
            <strong>Activity tab</strong> &mdash; View, filter, edit, or manually add individual
            MQD entries.
          </li>
          <li>
            <strong>Re-import</strong> &mdash; You can import the same PDF multiple times. The
            tracker will de-duplicate entries and update pending flights that have since completed.
          </li>
          <li>
            <strong>Export/Import backup</strong> &mdash; Use the Data Management section in
            Settings to export your data as a JSON file. You can import it back later to restore
            your session.
          </li>
        </ul>
      </div>

      <div className="card">
        <h3>How It Works &mdash; Privacy &amp; Security</h3>
        <ul>
          <li>
            <strong>No server, no database.</strong> This site runs entirely in your browser.
            Your PDF is parsed locally using JavaScript &mdash; it is never uploaded to any server.
          </li>
          <li>
            <strong>No data is stored.</strong> Nothing is saved to your device, to cookies, or
            to any cloud service. All data exists only in memory while the page is open.
          </li>
          <li>
            <strong>No history.</strong> There are no user accounts, no login, and no tracking
            of any kind.
          </li>
          <li>
            <strong>When you leave, it's gone.</strong> If you close the tab, refresh the page,
            or navigate away, all of your data is permanently erased. There is no way to recover
            it unless you exported a backup first.
          </li>
        </ul>
      </div>
    </div>
  );
}
