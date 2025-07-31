export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Terms & Service
        </h1>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            1. Acceptance of Terms
          </h3>
          <p className="text-muted-foreground">
            By accessing and using the TattooFinder website and services, you
            accept and agree to be bound by the terms and provision of this
            agreement. If you do not agree to abide by the above, please do not
            use this service.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            2. Use License
          </h3>
          <p className="text-muted-foreground mb-2">
            Permission is granted to temporarily use TattooFinder for personal,
            non-commercial transitory viewing only. This is the grant of a
            license, not a transfer of title, and under this license you may
            not:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>modify or copy the materials</li>
            <li>
              use the materials for any commercial purpose or for any public
              display
            </li>
            <li>
              attempt to reverse engineer any software contained on the website
            </li>
            <li>
              remove any copyright or other proprietary notations from the
              materials
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            3. User Conduct
          </h3>
          <p className="text-muted-foreground">
            Users agree to use the service responsibly and not to engage in any
            activity that could harm the service, other users, or third parties.
            This includes but is not limited to: providing false information,
            attempting to access unauthorized areas, or using the service for
            illegal purposes.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            4. Intellectual Property Rights
          </h3>
          <p className="text-muted-foreground">
            All content on TattooFinder, including but not limited to images,
            text, graphics, logos, and software, is the property of TattooFinder
            or its content suppliers and is protected by copyright and other
            intellectual property laws.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            5. Disclaimers
          </h3>
          <p className="text-muted-foreground">
            The information on this website is provided on an 'as is' basis. To
            the fullest extent permitted by law, TattooFinder excludes all
            representations, warranties, conditions and other terms which might
            otherwise be implied by statute, common law or the law of equity.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            6. Limitations of Liability
          </h3>
          <p className="text-muted-foreground">
            In no event shall TattooFinder or its suppliers be liable for any
            damages (including, without limitation, damages for loss of data or
            profit, or due to business interruption) arising out of the use or
            inability to use the materials on TattooFinder's website.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            7. Governing Law
          </h3>
          <p className="text-muted-foreground">
            These terms and conditions are governed by and construed in
            accordance with the laws of the jurisdiction in which TattooFinder
            operates, and any disputes relating to these terms and conditions
            will be subject to the exclusive jurisdiction of the courts in that
            jurisdiction.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            8. Changes to Terms
          </h3>
          <p className="text-muted-foreground">
            TattooFinder reserves the right to revise these terms of service at
            any time without notice. By using this website, you are agreeing to
            be bound by the then current version of these terms of service.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            9. Contact Information
          </h3>
          <p className="text-muted-foreground">
            If you have any questions about these Terms of Service, please
            contact us at:
            <br />
            Email: legal@tattoofinder.com
            <br />
            Address: 123 Legal Street, Terms City, TC 12345
          </p>
        </div>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}
